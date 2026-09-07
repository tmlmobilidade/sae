/* * */

import { DAY_TYPES } from '@/day-types.js';
import { getFormattedDates, getPeriodName, getWeekdayNames } from '@/get-names.js';
import { type CalendarAssignmentsExt, type CalendarExt, type DayTypeConfig, type ExportToHitouchConfig, type GtfsDate } from '@/types.js';
import { type GtfsCalendar, type GtfsCalendarDates, validateGtfsDate } from '@tmlmobilidade/go-types-gtfs';
import { type GtfsStrictV29ExtStopTimes, type GtfsStrictV29ExtTrips } from '@tmlmobilidade/go-types-gtfs-strict';
import { type OperationalDate, validateOperationalDate } from '@tmlmobilidade/go-types-shared';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { type GtfsStrictV29ExtSQLTables } from '@tmlmobilidade/import-gtfs';
import { Logger } from '@tmlmobilidade/logger';
import { generateRandomString } from '@tmlmobilidade/strings';
import { CsvWriter } from '@tmlmobilidade/writers';
import fs from 'node:fs';
import Papa from 'papaparse';

/* * */

export async function exportCalendarFiles(sqlTables: GtfsStrictV29ExtSQLTables, exportConfig: ExportToHitouchConfig, datesMap: Map<OperationalDate, GtfsDate>) {
	//

	//
	// Build the day-type date lists from the generated GTFS date metadata.

	const dayTypesConfig: DayTypeConfig[] = DAY_TYPES.map(dayType => ({ ...dayType, dates: [] }));

	for (const d of datesMap.values()) {
		// Add this date to the corresponding day_type_id
		const dayTypeTable = dayTypesConfig.find(dt => dt.period === d.period && dt.day_type === d.day_type);
		if (dayTypeTable) dayTypeTable.dates.push(d.date);
	}

	//
	// Get all unique Pattern IDs from trips

	const allPatternIds = sqlTables.trips.all().map(trip => trip.pattern_id).sort();
	const allUniquePatternIds = Array.from(new Set(allPatternIds));

	Logger.info({ message: `Found ${allUniquePatternIds.length} unique pattern IDs in trips.` });

	const updatedServiceIds: Record<string, { _id: string, dates: OperationalDate[], day_type: string, exceptions: string[], period: string }> = {};

	//
	// Loop through each pattern_id and find trips associated with it

	for (const patternId of allUniquePatternIds) {
		//

		//
		// Get all trips with this pattern_id

		const allTripsForThisPatternId = sqlTables.trips.all('WHERE pattern_id = ?', [patternId]);

		if (!allTripsForThisPatternId?.length) continue;

		//
		// Group trips that have the same stop_times

		const equalTrips: Record<string, { sample_stop_times: GtfsStrictV29ExtStopTimes[], sample_trip: GtfsStrictV29ExtTrips, service_ids: string[], start_time: string, trip_ids: string[] }> = {};

		for (const tripData of allTripsForThisPatternId) {
			// Get stop_times for this trip
			const stopTimesForTrip = sqlTables.stop_times.all('WHERE trip_id = ? ORDER BY stop_sequence ASC', [tripData.trip_id]);
			if (!stopTimesForTrip?.length) continue;
			// Stringify stop_times to use as a key.
			// This ignores trip_id to group trips with same stop_times but different trip_ids,
			// essentially grouping trips with same pattern and timings but different service_ids.
			// Save the arrival_time of the first stop as start_time for later reference,
			// as well as the list of service_ids associated with these trips.
			const stopTimesKey = stopTimesForTrip.map(st => JSON.stringify({ ...st, trip_id: null })).join('|');
			if (!equalTrips[stopTimesKey]) {
				equalTrips[stopTimesKey] = {
					sample_stop_times: stopTimesForTrip,
					sample_trip: tripData,
					service_ids: [],
					start_time: stopTimesForTrip[0].arrival_time.slice(0, 5).replaceAll(':', ''),
					trip_ids: [],
				};
			}
			equalTrips[stopTimesKey].trip_ids.push(tripData.trip_id);
			equalTrips[stopTimesKey].service_ids.push(tripData.service_id);
		}

		//
		// For each group of trips with identical stop_times,
		// merge their service_ids into a single one.

		for (const equalTripsData of Object.values(equalTrips)) {
			//

			//
			// Merge all dates from all service_ids into a single one,
			// and categorize them by day_type, period and weekday.

			const combinedDatesMap: Record<string, { dates: Set<OperationalDate>, day_type: string, period: string, service_ids: Set<string> }> = {};

			for (const serviceId of equalTripsData.service_ids) {
				// Get all dates for this service_id
				const serviceDates = sqlTables.calendar_dates[serviceId];
				if (!serviceDates.length) continue;
				// Categorize each date
				serviceDates.forEach((gtfsDate) => {
					const date = validateOperationalDate(gtfsDate);
					// Get the generated metadata for this date
					const matchingDateEntry = datesMap.get(date);
					if (!matchingDateEntry) throw new Error(`Date ${date} for service_id ${serviceId} has no generated date metadata.`);
					// Build a key for this combination.
					// By categorizing by day_type and period, the concept of trips and services
					// becomes more about the category of service rather than the specific service_id,
					// allowing for rebuilding calendars based on semantic service patterns.
					const combinedDateKey = `${matchingDateEntry.period}|${matchingDateEntry.day_type}`;
					if (!combinedDatesMap[combinedDateKey]) {
						combinedDatesMap[combinedDateKey] = {
							dates: new Set(),
							day_type: matchingDateEntry.day_type,
							period: matchingDateEntry.period,
							service_ids: new Set(),
						};
					}
					combinedDatesMap[combinedDateKey].dates.add(date);
					combinedDatesMap[combinedDateKey].service_ids.add(serviceId);
				});
			}

			//
			// Now that equal trips have been combined into categorized date sets,
			// representing their actual operational patterns (e.g., weekday, weekend, only on monday),
			// we can proceed to rebuild the trips, stop_times, calendar and the calendar_dates tables.

			for (const combinedDatesData of Object.values(combinedDatesMap)) {
				//

				//
				// Setup a service ID, or reuse an existing one if
				// the exact set of dates already exists.

				const sortedDates = Array.from(combinedDatesData.dates).sort();

				const serviceIdKey = sortedDates.join('|');

				if (!updatedServiceIds[serviceIdKey]) {
					updatedServiceIds[serviceIdKey] = {
						_id: generateRandomString(),
						dates: sortedDates,
						day_type: combinedDatesData.day_type,
						exceptions: [],
						period: combinedDatesData.period,
					};
				}

				//
				// Delete original entries from trips and stop_times

				equalTripsData.trip_ids.forEach((tripId) => {
					sqlTables.trips.run('DELETE FROM trips WHERE trip_id = ?', [tripId]);
					sqlTables.stop_times.run('DELETE FROM stop_times WHERE trip_id = ?', [tripId]);
				});

				//
				// Recreate trips and stop_times with new service_id,
				// and a new trip_id. Notice that before there were multiple trips
				// with different service_ids, but now there will be only one trip with the updated service_id.
				// This is because we are merging identical services into a single one. Before, there were more trips
				// spread across multiple service_ids, now there will be fewer trips but with more dates on each service.

				const newTripId = `${equalTripsData.sample_trip.shape_id}||${equalTripsData.start_time}|${combinedDatesData.period}|${combinedDatesData.day_type}|${updatedServiceIds[serviceIdKey]._id}`;

				sqlTables.trips.write({ ...equalTripsData.sample_trip, service_id: updatedServiceIds[serviceIdKey]._id, trip_id: newTripId });
				equalTripsData.sample_stop_times.forEach(st => sqlTables.stop_times.write({ ...st, trip_id: newTripId }));

				//
				// Flush changes to trips and stop_times tables to ensure
				// all deletions and insertions are committed.

				sqlTables.trips.flush();
				sqlTables.stop_times.flush();

				//
			}

			//
		}

		//
	}

	//
	// Now we have an organized and consolidated set of services.
	// However, since our goal is to export to a analogic support (the posters),
	// we need to further simplify our calendar structure to fit the constraints of the medium.
	// Posters have 9 timetable slots, one for each day_type and period combination.
	// We need to detect the exceptions to these combinations, include them in a separate file,
	// and then simplify our calendar to include only one date per day_type and period combination,
	// so we can fit everything into the 9 slots available.

	// TABLE OF CONTENTS:
	// CASE 1 — EXACT MATCH FOR DAY_TYPE AND PERIOD
	// CASE 2 — REGULAR ON ALL FOUND WEEKDAYS (eg. Mondays, Wednesdays and Fridays)
	// CASE 3 — REGULAR ON SOME WEEKDAYS BUT NOT ALL
	// CASE 4 — IRREGULAR SERVICE (REMOVED DATES)
	// CASE 5 — IRREGULAR SERVICE (ADDED DATES)

	for (const [serviceIdKey, serviceIdData] of Object.entries(updatedServiceIds)) {
		//

		//
		// CASE 1 — EXACT MATCH FOR DAY_TYPE AND PERIOD
		// Check if this service_id matches any of the standard
		// day_type and period combinations exactly.

		const matchedDayType = dayTypesConfig.find(dt => dt.day_type === serviceIdData.day_type && dt.period === serviceIdData.period);
		if (!matchedDayType) throw new Error(`Service ID ${serviceIdData._id} with day_type ${serviceIdData.day_type} and period ${serviceIdData.period} does not match any known day_type and period combination.`);

		const isExactMatch = serviceIdData.dates.length === matchedDayType.dates.length && matchedDayType.dates.every(date => serviceIdData.dates.includes(date));

		if (isExactMatch) {
			Logger.info({ message: `Service ID "${serviceIdData._id}" [CASE 1] Matches exactly the day_type ${serviceIdData.day_type} and period ${serviceIdData.period}. Qty # ${serviceIdData.dates.length} dates.` });
			continue;
		}

		//
		// If the match is not exact, start by counting the occurrences of each weekday
		// in the service_id dates and the matched day_type dates. If the counts match
		// for a weekday, we consider that weekday to be regular, otherwise it is an exception.

		const serviceIdWeekdaysMap: Record<string, { count: number, dates: OperationalDate[] }> = {};

		for (const date of serviceIdData.dates) {
			// Get the generated metadata for this date
			const matchingDateEntry = datesMap.get(date);
			if (!matchingDateEntry) throw new Error(`Date ${date} for service_id ${serviceIdData._id} has no generated date metadata.`);
			// Get the weekday code for this date
			let weekdayCode = Dates
				.fromOperationalDateInt(date, 'Europe/Lisbon')
				.toFormat('c'); // '1' (Mon) to '7' (Sun)
			// Treat holidays as Sundays
			if (matchingDateEntry.holiday === '1') weekdayCode = '7';
			// Create a new entry for this weekday if it doesn't exist yet
			if (!serviceIdWeekdaysMap[weekdayCode]) serviceIdWeekdaysMap[weekdayCode] = { count: 0, dates: [] };
			// Increment the count for this weekday
			serviceIdWeekdaysMap[weekdayCode].count++;
			serviceIdWeekdaysMap[weekdayCode].dates.push(date);
		}

		const matchedDayTypeWeekdaysMap: Record<string, { count: number, dates: OperationalDate[] }> = {};

		for (const date of matchedDayType.dates) {
			// Get the generated metadata for this date
			const matchingDateEntry = datesMap.get(date);
			if (!matchingDateEntry) throw new Error(`Date ${date} for service_id ${serviceIdData._id} has no generated date metadata.`);
			// Get the weekday code for this date
			let weekdayCode = Dates
				.fromOperationalDateInt(date, 'Europe/Lisbon')
				.toFormat('c'); // '1' (Mon) to '7' (Sun)
			// Treat holidays as Sundays
			if (matchingDateEntry.holiday === '1') weekdayCode = '7';
			// Create a new entry for this weekday if it doesn't exist yet
			if (!matchedDayTypeWeekdaysMap[weekdayCode]) matchedDayTypeWeekdaysMap[weekdayCode] = { count: 0, dates: [] };
			// Increment the count for this weekday
			matchedDayTypeWeekdaysMap[weekdayCode].count++;
			matchedDayTypeWeekdaysMap[weekdayCode].dates.push(date);
		}

		const weekdaysMap: Record<string, { dates_expected: OperationalDate[], dates_found: OperationalDate[], dates_missing: OperationalDate[], is_regular: boolean }> = {};

		for (const [weekdayCode, serviceWeekdayData] of Object.entries(serviceIdWeekdaysMap)) {
			// Save the expected count from the matched day type configuration
			weekdaysMap[weekdayCode] = {
				dates_expected: matchedDayTypeWeekdaysMap[weekdayCode].dates,
				dates_found: serviceWeekdayData.dates,
				dates_missing: matchedDayTypeWeekdaysMap[weekdayCode].dates.filter(d => !serviceWeekdayData.dates.includes(d)),
				is_regular: matchedDayTypeWeekdaysMap[weekdayCode].count === serviceWeekdayData.count,
			};
		}

		//
		// CASE 2 — REGULAR ON ALL FOUND WEEKDAYS (eg. Mondays, Wednesdays and Fridays)
		// If a service is regular on all expected weekdays, we can simply note that
		// in the calendarExt.txt file and move on. No need to list all dates.
		// Example: "Às segundas, quartas e sextas de Período Escolar."

		const serviceIsRegularOnAllExpectedWeekdays = Object.values(weekdaysMap).every(v => v.is_regular);

		if (serviceIsRegularOnAllExpectedWeekdays) {
			// Get friendly names for weekdays and period
			const weekdayNames = getWeekdayNames(Object.keys(weekdaysMap));
			const periodName = getPeriodName(serviceIdData.period);
			// Add exception
			updatedServiceIds[serviceIdKey].exceptions.push(`Às ${weekdayNames.join(', ').replace(/, ([^,]*)$/, ' e $1')} de ${periodName}.`);
			// Log and continue to next service ID
			Logger.info({ message: `Service ID "${serviceIdData._id}" [CASE 2] Is regular on all expected weekdays (${weekdayNames.join(', ')}) during ${periodName}. Qty # ${serviceIdData.dates.length} dates.` });
			continue;
		}

		//
		// CASE 3 — REGULAR ON SOME WEEKDAYS BUT NOT ALL
		// If a service is regular only on some weekdays, we need to list the exceptions.
		// A weekday is considered "almost" regular if the number of occurrences in the service_id
		// is greater than the number of missing dates in the matched day type.
		// Handle the case where all weekdays are present (regular) but some have missing dates. This is the same
		// as CASE 4 or CASE 5, since business days, saturdays and sundays have their own timetables.
		// Example: "Às segundas, quartas e sextas de Período Escolar, excepto a 25/12/2022."

		const isAllBusinessDays = Object.keys(weekdaysMap).length === 5;
		const isSaturdayOrSunday = weekdaysMap['6'] || weekdaysMap['7'];

		const almostRegularWeekdays = Object.entries(weekdaysMap).filter(([, weekdayData]) => weekdayData.is_regular || weekdayData.dates_found.length > weekdayData.dates_missing.length);

		if (almostRegularWeekdays.length && !isAllBusinessDays && !isSaturdayOrSunday) {
			// Get friendly names for weekdays and period
			const weekdayNames = getWeekdayNames(almostRegularWeekdays.map(([weekdayCode]) => weekdayCode));
			const periodName = getPeriodName(serviceIdData.period);
			// Get the exception dates for the non-regular weekdays
			const exceptionDates = Object.entries(weekdaysMap)
				.flatMap(([, weekdayData]) => weekdayData.dates_missing);
			const exceptionDatesFormatted = getFormattedDates(exceptionDates);
			// Detect is plural or singular
			let prefix = 'excepto a';
			if (exceptionDates.length > 1) prefix = 'excepto nos dias';
			// Add exception
			updatedServiceIds[serviceIdKey].exceptions.push(`Às ${weekdayNames.join(', ').replace(/, ([^,]*)$/, ' e $1')} de ${periodName}, ${prefix} ${exceptionDatesFormatted}.`);
			// Log and continue to next service ID
			Logger.info({ message: `Service ID "${serviceIdData._id}" [CASE 3] Is regular on some weekdays (${weekdayNames.join(', ')}) during ${periodName}. Qty # ${serviceIdData.dates.length} dates. Exceptions: ${exceptionDatesFormatted.length} dates.` });
			continue;
		}

		//
		// CASE 4 — IRREGULAR SERVICE (REMOVED DATES)
		// If a service is irregular, and there are more dates with service that missing ones,
		// we need to list all dates where the service is not active. This is usually the case of
		// reduced service on christmas and new year, for example.
		// Example: "Excepto a 25/12/2022, 01/01/2023 e 15/08/2023."

		const datesWhereServiceIsActive = Object.values(weekdaysMap).flatMap(weekdayData => weekdayData.dates_found);
		const datesWhereServiceIsMissingButIsExpected = Object.values(weekdaysMap).flatMap(weekdayData => weekdayData.dates_missing);

		if (datesWhereServiceIsActive.length > datesWhereServiceIsMissingButIsExpected.length) {
			// Get the exception dates
			const exceptionDates = Object.entries(weekdaysMap)
				.flatMap(([, weekdayData]) => weekdayData.dates_missing);
			const exceptionDatesFormatted = getFormattedDates(exceptionDates);
			// Add exception
			updatedServiceIds[serviceIdKey].exceptions.push(`Excepto ${exceptionDatesFormatted}`);
			// Log and continue to next service ID
			Logger.info({ message: `Service ID "${serviceIdData._id}" [CASE 4] Is irregular with more active dates (${datesWhereServiceIsActive.length}) than missing ones (${datesWhereServiceIsMissingButIsExpected.length}). Qty # ${serviceIdData.dates.length} dates. Exceptions: ${exceptionDatesFormatted.length} dates.` });
			continue;
		}

		//
		// CASE 5 — IRREGULAR SERVICE (ADDED DATES)
		// If a service is irregular, and there are more dates without service that active ones,
		// we need to list all dates where the service is active. This is usually the case of
		// special services for events or holidays.
		// Example: "Apenas a 01/01/2023 e 15/08/2023."

		const exceptionDates = Object.entries(weekdaysMap)
			.flatMap(([, weekdayData]) => weekdayData.dates_found);
		const exceptionDatesFormatted = getFormattedDates(exceptionDates);

		updatedServiceIds[serviceIdKey].exceptions.push(`Disponível ${exceptionDatesFormatted}`);

		Logger.info({ message: `Service ID "${serviceIdData._id}" [CASE 5] Is irregular with more missing dates (${datesWhereServiceIsMissingButIsExpected.length}) than active ones (${datesWhereServiceIsActive.length}). Qty # ${serviceIdData.dates.length} dates. Exceptions: ${exceptionDatesFormatted.length} dates.` });

		//
	}

	//
	// Deduplicate exceptions and add an index for reference

	const uniqueExceptions = new Set(Object.values(updatedServiceIds).flatMap(sid => sid.exceptions).filter(e => e));

	const uniqueExceptionsMap: Record<string, { comment: string, index: string }> = {};

	const indexesList = ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '¹⁰', '¹¹', '¹²', '¹³', '¹⁴', '¹⁵', '¹⁶', '¹⁷', '¹⁸', '¹⁹', '²⁰', '²¹', '²²', '²³', '²⁴', '²⁵', '²⁶', '²⁷', '²⁸', '²⁹', '³⁰', '³¹', '³²', '³³', '³⁴', '³⁵', '³⁶', '³⁷', '³⁸', '³⁹', '⁴⁰', '⁴¹', '⁴²', '⁴³', '⁴⁴', '⁴⁵', '⁴⁶', '⁴⁷', '⁴⁸', '⁴⁹', '⁵⁰'];

	Array.from(uniqueExceptions).sort().forEach((exception, index) => uniqueExceptionsMap[exception] = { comment: exception, index: indexesList[index] });

	//
	// Output the calendar assignments file with the new service_ids,
	// and the calendar exceptions file with the detected exceptions.

	const calendarCsv = exportConfig.source_has_calendar ? new CsvWriter('calendar.txt', `${exportConfig.workdir}/calendar.txt`, { batch_size: 100000 }) : undefined;
	const calendarDatesCsv = new CsvWriter('calendar_dates.txt', `${exportConfig.workdir}/calendar_dates.txt`, { batch_size: 100000 });
	const calendarAssignmentsExtFields: (keyof CalendarAssignmentsExt)[] = ['day_type_id', 'service_id'];
	const calendarAssignmentsExtRows: CalendarAssignmentsExt[] = [];
	const calendarExtFields: (keyof CalendarExt)[] = ['service_id', 'index', 'comment'];
	const calendarExtRows: CalendarExt[] = [];

	//
	// Loop through each service_id and output the calendar files

	for (const serviceIdData of Object.values(updatedServiceIds)) {
		//
		// Sort the dates

		const sortedDates = serviceIdData.dates.sort();

		//
		// Output the calendar file

		if (calendarCsv) {
			//
			// Output the calendar data

			const calendarData: GtfsCalendar = {
				end_date: validateGtfsDate(sortedDates.at(-1) ?? exportConfig.date_range.end),
				friday: '0',
				monday: '0',
				saturday: '0',
				service_id: serviceIdData._id,
				start_date: validateGtfsDate(sortedDates.at(0) ?? exportConfig.date_range.start),
				sunday: '0',
				thursday: '0',
				tuesday: '0',
				wednesday: '0',
			};
			await calendarCsv.write(calendarData);
		}

		//
		// Output the calendar assignments file

		for (const dayTypeConfig of dayTypesConfig) {
			// Check if this service operates on the same day_type
			// and period for this day_type.
			const matchedDayType = serviceIdData.day_type === dayTypeConfig.day_type;
			const matchedPeriod = serviceIdData.period === dayTypeConfig.period;
			if (!matchedDayType || !matchedPeriod) continue;
			// If it matches, create an assignment
			const assignment: CalendarAssignmentsExt = {
				day_type_id: dayTypeConfig._id,
				service_id: serviceIdData._id,
			};
			calendarAssignmentsExtRows.push(assignment);
		}

		//
		// Output any exceptions for this service_id

		serviceIdData.exceptions = Array.from(new Set(serviceIdData.exceptions));
		for (const exceptionData of serviceIdData.exceptions) {
			const calendarException: CalendarExt = {
				comment: exceptionData,
				index: uniqueExceptionsMap[exceptionData].index,
				service_id: serviceIdData._id,
			};
			calendarExtRows.push(calendarException);
		}

		//
		// Output all dates for this service_id

		for (const operationalDate of sortedDates) {
			const data: GtfsCalendarDates = {
				date: validateGtfsDate(operationalDate),
				exception_type: '1',
				service_id: serviceIdData._id,
			};
			await calendarDatesCsv.write(data);
		}
	}

	//
	// Flush the calendar files

	await calendarCsv?.flush();
	await calendarDatesCsv.flush();

	//
	// Output the calendar assignments file

	if (calendarAssignmentsExtRows.length) {
		//
		// Output the calendar assignments data

		const calendarAssignmentsExtCsvData = Papa.unparse(
			{ data: calendarAssignmentsExtRows, fields: calendarAssignmentsExtFields },
			{
				newline: '\n',
				quotes: value => !calendarAssignmentsExtFields.includes(value as keyof CalendarAssignmentsExt),
			},
		);
		fs.writeFileSync(`${exportConfig.workdir}/calendar_assignmentsExt.txt`, calendarAssignmentsExtCsvData, { encoding: 'utf-8', flush: true });
	}

	if (calendarExtRows.length) {
		//
		// Output the calendar exceptions data

		const calendarExtCsvData = Papa.unparse(
			{ data: calendarExtRows, fields: calendarExtFields },
			{
				newline: '\n',
				quotes: value => !calendarExtFields.includes(value as keyof CalendarExt),
			},
		);
		fs.writeFileSync(`${exportConfig.workdir}/calendarExt.txt`, calendarExtCsvData, { encoding: 'utf-8', flush: true });
	}

	//
	// Log the exported calendar files

	const exportedCalendarFiles = [
		...(calendarCsv ? ['calendar.txt'] : []),
		'calendar_dates.txt',
		...(calendarAssignmentsExtRows.length ? ['calendar_assignmentsExt.txt'] : []),
		...(calendarExtRows.length ? ['calendarExt.txt'] : []),
	];

	Logger.info({ message: `Exported ${exportedCalendarFiles.join(', ')} files.` });

	//
	// Log completion

	Logger.info({ message: 'Merged service IDs into new calendars.' });

	for (const serviceIdData of Object.values(updatedServiceIds)) {
		Logger.info({ message: `Service ID "${serviceIdData._id}" has ${serviceIdData.dates.length} dates and ${serviceIdData.exceptions.length} exceptions.` });
	}

	//
}
