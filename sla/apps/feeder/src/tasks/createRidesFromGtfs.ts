/* * */

import { unzipFile } from '@/modules/unzipFile.js';
import DBWRITER from '@/services/DBWRITER.js';
import SLAMANAGERDB from '@/services/SLAMANAGERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { plans, rides } from '@tmlmobilidade/services/interfaces';
import { createOperationalDate, OperationalDate } from '@tmlmobilidade/services/types';
import crypto from 'crypto';
import { parse as csvParser } from 'csv-parse';
import fs from 'fs';
import { DateTime } from 'luxon';

/* * */

export async function createRidesFromGtfs() {
	try {
		//

		LOGGER.init();

		const globalTimer = new TIMETRACKER();

		//
		// Setup database writers

		const hashedTripsDbWritter = new DBWRITER('HashedTrip', SLAMANAGERDB.HashedTrip);
		const hashedShapesDbWritter = new DBWRITER('HashedShape', SLAMANAGERDB.HashedShape);
		const ridesDbWritter = new DBWRITER('Rides', SLAMANAGERDB.TripAnalysis);

		//
		// Setup variables to keep track of created IDs

		const parsedPlanIds = new Set();
		const createdHashedTripCodes = new Set();
		const createdHashedShapeCodes = new Set();
		const createdTripAnalysisCodes = new Set();

		// 4.
		// Get all Plans and iterate on each one

		const allPlansData = await plans.all();

		console.log(`→ Found ${allPlansData.length} Plans to process...`);

		for (const [planIndex, planData] of allPlansData.entries()) {
			try {
				//

				//
				// Skip parsing if this plan is not parseable

				if (!planData.operation_file) continue;
				if (planData.status === 'pending') continue;

				//
				// Setup variables to save formatted entities found in this Plan

				const savedCalendarDates = new Map<string, OperationalDate[]>();
				const savedTrips = new Map();
				const savedStops = new Map();
				const savedRoutes = new Map();
				const savedShapes = new Map();
				const savedStopTimes = new Map();

				const referencedStops = new Set();
				const referencedShapes = new Set();
				const referencedRoutes = new Set();

				//
				// Get the associated start and end dates for this plan.
				// Even though most operation plans (GTFS files) will be annual, as in having calendar_dates for a given year,
				// they are valid only on a given set of days, usually one month. Therefore we have multiple annual plans, each one
				// valid on a different month. The validity dates will be used to clip the calendars and only saved the actual part
				// of the plan that was actually active in that period.

				//
				// Setup a temporary location to extract each GTFS plan

				const downloadUrl = `https://go.carrismetropolitana.pt/api/media/${planData.operation_file}/download_public`;
				const downloadDirPath = `${process.env.APP_TMP_DIR}/downloads/${planData.operation_file}.zip`;
				const extractDirPath = `${process.env.APP_TMP_DIR}/extractions/${Math.floor(Math.random() * 1000)}/${planData._id}`;

				//
				// Download and unzip the associated operation plan

				const planFileData = await fetch(downloadUrl).then(response => response.blob());
				const planFileBuffer = await planFileData.arrayBuffer();

				fs.writeFileSync(downloadDirPath, Buffer.from(planFileBuffer));

				await unzipFile(downloadDirPath, extractDirPath);

				LOGGER.info(`[${planIndex + 1}/${allPlansData.length}] Plan ${planData._id} | valid_from: ${planData.valid_from} | valid_until: ${planData.valid_until}`);

				//
				// The order of execution matters when parsing each file. This is because plans are valid on a set of dates.
				// By first parsing calendar_dates.txt, we know exactly which service_ids "were active" in the set of dates.
				// Then, when parsing trips.txt, only trips that belong to those service_ids will be included. And so on, for each file.
				// By having a list of trips we can extract only the necessary info from the other files, and thus reducing significantly
				// the amount of information to be checked.

				//
				// Extract calendar_dates.txt and filter only service_ids valid between the given plan start_date and end_date.

				try {
					//

					LOGGER.info(`Reading zip entry "calendar_dates.txt" of plan "${planData._id}"...`);

					//
					// Parse each row, and save only the matching servic_ids

					const parseEachRow = async (data) => {
						//

						//
						// Validate the date to ensure it is of type OperationalDate

						let currentOperationalDate: OperationalDate;

						try {
							currentOperationalDate = createOperationalDate(data.date);
						}
						catch (error) {
							LOGGER.error(`Error parsing date ${data.date} of plan ${planData._id}`, error);
							return;
						}

						//
						// Skip if this row's date is before the plan's start date or after the plan's end date

						if (currentOperationalDate < planData.valid_from || currentOperationalDate > planData.valid_until) return;

						//
						// Get the previously saved calendar

						const savedCalendar = savedCalendarDates.get(data.service_id);

						if (savedCalendar) {
							// If this service_id was previously saved, add the current date to it
							savedCalendarDates.set(data.service_id, Array.from(new Set([currentOperationalDate, ...savedCalendar])));
						}
						else {
							// If this is the first time we're seeing this service_id, initiate the dates array with the current date
							savedCalendarDates.set(data.service_id, [currentOperationalDate]);
						}
						//
					};

					//
					// Setup the CSV parsing operation

					await parseCsvFile(`${extractDirPath}/calendar_dates.txt`, parseEachRow);

					LOGGER.success(`Finished processing "calendar_dates.txt" of plan "${planData._id}"`);

					//
				}
				catch (error) {
					LOGGER.error('Error processing "calendar_dates.txt" file.', error);
					throw new Error('✖︎ Error processing "calendar_dates.txt" file.');
				}

				//
				// Next up: trips.txt
				// Now that the calendars are sorted out, the jobs is easier for the trips.
				// Only include trips which have the referenced service IDs saved before.

				try {
					//

					LOGGER.info(`Reading zip entry "trips.txt" of plan "${planData._id}"...`);

					//
					// For each trip, check if the associated service_id was saved in the previous step or not.
					// Include it if yes, skip otherwise.

					const parseEachRow = async (data) => {
						//

						//
						// Skip if this row's service_id was not saved before
						if (!savedCalendarDates.has(data.service_id)) return;

						//
						// Format the exported row. Only include the minimum required to prevent memory bloat later on.

						const parsedRowData = {
							pattern_id: data.pattern_id,
							route_id: data.route_id,
							service_id: data.service_id,
							shape_id: data.shape_id,
							trip_headsign: data.trip_headsign,
							trip_id: data.trip_id,
						};

						//
						// Save this trip for later

						savedTrips.set(data.trip_id, parsedRowData);

						//
						// Reference the route_id and shape_id to filter them later
						referencedRoutes.add(data.route_id);
						referencedShapes.add(data.shape_id);

						//
					};

					// 4.8.2.
					// Setup the CSV parsing operation

					await parseCsvFile(`${extractDirPath}/trips.txt`, parseEachRow);

					LOGGER.success(`Finished processing "trips.txt" of plan "${planData._id}"`);

					//
				}
				catch (error) {
					LOGGER.error('Error processing "trips.txt" file.', error);
					throw new Error('✖︎ Error processing "trips.txt" file.');
				}

				//
				// Next up: routes.txt
				// For routes, only include the ones referenced in the filtered trips.

				try {
					//

					LOGGER.info(`Reading zip entry "routes.txt" of plan "${planData._id}"...`);

					// 4.9.1.
					// For each route, only save the ones referenced by previously saved trips.

					const parseEachRow = async (data) => {
						//

						//
						// Skip if this row's route_id was not saved before
						if (!referencedRoutes.has(data.route_id)) return;

						//
						// Format the exported row

						const parsedRowData = {
							agency_id: data.agency_id,
							line_id: data.line_id,
							line_long_name: data.line_long_name,
							line_short_name: data.line_short_name,
							route_color: data.route_color,
							route_id: data.route_id,
							route_long_name: data.route_long_name,
							route_short_name: data.route_short_name,
							route_text_color: data.route_text_color,
						};

						savedRoutes.set(data.route_id, parsedRowData);

						//
					};

					// 4.9.2.
					// Setup the CSV parsing operation

					await parseCsvFile(`${extractDirPath}/routes.txt`, parseEachRow);

					LOGGER.success(`Finished processing "routes.txt" of plan "${planData._id}"`);

					//
				}
				catch (error) {
					LOGGER.error('Error processing "routes.txt" file.', error);
					throw new Error('✖︎ Error processing "routes.txt" file.');
				}

				//
				// Next up: shapes.txt
				// Do a similiar check as the previous step. Only include the shapes for trips referenced before.

				try {
					//

					LOGGER.info(`Reading zip entry "shapes.txt" of plan "${planData._id}"...`);

					//
					// For each point of each shape, check if the shape_id was referenced by valid trips.

					const parseEachRow = async (data) => {
						//

						//
						// Skip if this row's trip_id was not saved before

						if (!referencedShapes.has(data.shape_id)) return;

						const thisShapeRowPoint = {
							shape_pt_lat: data.shape_pt_lat,
							shape_pt_lon: data.shape_pt_lon,
							shape_pt_sequence: Number(data.shape_pt_sequence),
						};

						//
						// Get the previously saved shape

						const savedShape = savedShapes.has(data.shape_id);

						if (savedShape) {
							// If this shape_id was previously saved, add the current point to it
							savedShapes.get(data.shape_id).push(thisShapeRowPoint);
						}
						else {
							// If this is the first time we're seeing this shape_id, initiate the points array with the current point
							savedShapes.set(data.shape_id, [thisShapeRowPoint]);
						}

						//
					};

					//
					// Setup the CSV parsing operation

					await parseCsvFile(`${extractDirPath}/shapes.txt`, parseEachRow);

					LOGGER.success(`Finished processing "shapes.txt" of plan "${planData._id}"`);

					//
				}
				catch (error) {
					LOGGER.error('Error processing "shapes.txt" file.', error);
					throw new Error('✖︎ Error processing "shapes.txt" file.');
				}

				//
				// Next up: stops.txt
				// For stops, include all of them since we don't have a way to filter them yet like trips/routes/shapes.
				// By saving all of them, we also speed up the processing of each stop_time by including the stop data right away.

				try {
					//

					console.log(`→ Reading zip entry "stops.txt" of plan "${planData._id}"...`);

					//
					// Save all stops, but only the mininum required data.

					const parseEachRow = async (data) => {
						//
						const parsedRowData = {
							stop_id: data.stop_id,
							stop_lat: data.stop_lat,
							stop_lon: data.stop_lon,
							stop_name: data.stop_name,
						};
						//
						savedStops.set(data.stop_id, parsedRowData);
						//
					};

					//
					// Setup the CSV parsing operation

					await parseCsvFile(`${extractDirPath}/stops.txt`, parseEachRow);

					LOGGER.success(`Finished processing "stops.txt" of plan "${planData._id}"`);

					//
				}
				catch (error) {
					LOGGER.error('Error processing "stops.txt" file.', error);
					throw new Error('✖︎ Error processing "stops.txt" file.');
				}

				//
				// Next up: stop_times.txt
				// Do a similiar check as the previous steps. Only include the stop_times for trips referenced before.
				// Since this is the most resource intensive operation of them all, include the associated stop data
				// right away to avoid another lookup later.

				try {
					//

					LOGGER.info(`Reading zip entry "stop_times.txt" of plan "${planData._id}"...`);

					//
					// For each stop of each trip, check if the associated trip_id was saved in the previous step or not.
					// Save valid stop times along with the associated stop data.

					const parseEachRow = async (data) => {
						//

						//
						// Skip if this row's trip_id was not saved before

						if (!savedTrips.has(data.trip_id)) return;

						//
						// Get the associated stop data. Skip if none found.

						const stopData = savedStops.get(data.stop_id);
						if (!stopData) return;

						const parsedRowData = {
							arrival_time: data.arrival_time,
							departure_time: data.departure_time,
							drop_off_type: data.drop_off_type,
							pickup_type: data.pickup_type,
							stop_id: data.stop_id,
							stop_lat: stopData.stop_lat,
							stop_lon: stopData.stop_lon,
							stop_name: stopData.stop_name,
							stop_sequence: Number(data.stop_sequence),
							timepoint: data.timepoint,
						};

						const savedStopTime = savedStopTimes.has(data.trip_id);

						if (savedStopTime) {
							savedStopTimes.get(data.trip_id).push(parsedRowData);
						}
						else {
							savedStopTimes.set(data.trip_id, [parsedRowData]);
						}

						referencedStops.add(data.stop_id);

						//
					};

					// 4.12.2.
					// Setup the CSV parsing operation

					await parseCsvFile(`${extractDirPath}/stop_times.txt`, parseEachRow);

					LOGGER.success(`Finished processing "stop_times.txt" of plan "${planData._id}"`);

					//
				}
				catch (error) {
					LOGGER.error('Error processing "stop_times.txt" file.', error);
					throw new Error('✖︎ Error processing "stop_times.txt" file.');
				}

				//
				// Transform each trip object into the database format, and save it to the database.
				// Combine the previously extracted info from all files into a single object.

				try {
					//

					for (const tripData of savedTrips.values()) {
						//

						//
						// Get associated data

						const calendarDatesData = savedCalendarDates.get(tripData.service_id);
						const stopTimesData = savedStopTimes.get(tripData.trip_id);
						const routeData = savedRoutes.get(tripData.route_id);
						const shapeData = savedShapes.get(tripData.shape_id);

						//
						// Setup the hashed trip data

						const hashedTripData = {
							//
							agency_id: routeData.agency_id,
							//
							line_id: routeData.line_id,
							line_long_name: routeData.line_long_name,
							line_short_name: routeData.line_short_name,
							//
							path: stopTimesData?.sort((a, b) => a.stop_sequence - b.stop_sequence),
							//
							pattern_id: tripData.pattern_id,
							route_color: routeData.route_color,
							//
							route_id: tripData.route_id,
							route_long_name: routeData.route_long_name,
							route_short_name: routeData.route_short_name,
							route_text_color: routeData.route_text_color,
							trip_headsign: tripData.trip_headsign,
							//
						};

						//
						// Hash the hashed trip contents to prevent duplicates
						// Check if this hashed trip already exists. If it does not exist, save it to the database.

						hashedTripData.code = crypto.createHash('sha256').update(JSON.stringify(hashedTripData)).digest('hex');
						const currentHashedTripAlreadyExists = await SLAMANAGERDB.HashedTrip.findOne({ code: hashedTripData.code });
						if (!currentHashedTripAlreadyExists) await hashedTripsDbWritter.write(hashedTripData, { filter: { code: hashedTripData.code }, upsert: true });
						createdHashedTripCodes.add(hashedTripData.code);

						//
						// Setup the hashed shape data

						const hashedShapeData = {
							agency_id: routeData.agency_id,
							points: shapeData?.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence),
							shape_id: tripData.shape_id,
						};

						//
						// Hash the hashed shape contents to prevent duplicates
						// Check if this hashed shape already exists. If it does not exist, save it to the database.

						hashedShapeData.code = crypto.createHash('sha256').update(JSON.stringify(hashedShapeData)).digest('hex');
						const currentHashedShapeAlreadyExists = await SLAMANAGERDB.HashedShape.findOne({ code: hashedShapeData.code });
						if (!currentHashedShapeAlreadyExists) await hashedShapesDbWritter.write(hashedShapeData, { filter: { code: hashedShapeData.code }, upsert: true });
						createdHashedShapeCodes.add(hashedShapeData.code);

						//
						// Create a trip analysis document for each day this trip is scheduled to run

						for (const calendarDate of calendarDatesData) {
							//
							const rideData = {
								agency_id: routeData.agency_id,
								analysis: [],
								analysis_timestamp: null,
								code: `${planData._id}-${routeData.agency_id}-${calendarDate}-${tripData.trip_id}`,
								hashed_shape_code: hashedShapeData.code,
								hashed_trip_code: hashedTripData.code,
								line_id: routeData.line_id,
								operational_day: calendarDate,
								parse_timestamp: new Date(),
								pattern_id: tripData.pattern_id,
								plan_id: planData._id,
								route_id: routeData.route_id,
								scheduled_start_time: hashedTripData.path?.length > 0 ? hashedTripData.path[0]?.arrival_time : null,
								service_id: tripData.service_id,
								status: 'pending',
								trip_id: tripData.trip_id,
								user_notes: '',
							};
							//
							const ridesOptions = {
								//
								filter: {
									code: rideData.code,
									// status: 'pending',
								},
								//
								upsert: true,
								//
								write_mode: 'replace',
								//
							};
							//
							await ridesDbWritter.write(rideData, ridesOptions);
							//
							createdTripAnalysisCodes.add(rideData.code);
							//
						}

						//
						// Delete the current trip to free up memory sooner

						savedTrips.delete(tripData.trip_id);
						savedStopTimes.delete(tripData.trip_id);

						//
					}

					await hashedTripsDbWritter.flush();
					await hashedShapesDbWritter.flush();
					await ridesDbWritter.flush();

					//
				}
				catch (error) {
					LOGGER.error('Error transforming or saving shapes to database.', error);
					throw new Error('✖︎ Error transforming or saving shapes to database.');
				}

				//
				// Remove orphan rides from plans which dates have changed since previous run.
				// Delete all rides for this plan_id that fall outside the current Plan valid range.

				await rides.deleteMany({ operational_day: { $nin: Array.from(savedCalendarDates.values()).flat() }, plan_id: planData._id });

				parsedPlanIds.add(planData._id);

				//

				LOGGER.success(`Finished processing plan ${planData._id}`);
				LOGGER.divider();

				//
			}
			catch (error) {
				LOGGER.error(`Error processing plan ${planData._id}`, error);
			}

			//
		}

		//

		LOGGER.terminate(`Run took ${globalTimer.get()}`);

		//
	}
	catch (error) {
		LOGGER.error('An error occurred. Halting execution.', error);
		LOGGER.error('Retrying in 10 seconds...');
		setTimeout(() => {
			process.exit(0); // End process
		}, 10000); // after 10 seconds
	}

	//
};

/* * */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseCsvFile(filePath: string, rowParser: (rowData: any) => Promise<void>) {
	const parser = csvParser({ bom: true, columns: true, record_delimiter: ['\n', '\r', '\r\n'], skip_empty_lines: true, trim: true });
	const fileStream = fs.createReadStream(filePath);
	const stream = fileStream.pipe(parser);
	for await (const rowData of stream) {
		await rowParser(rowData);
	}
}
