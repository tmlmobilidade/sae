/* * */

import { type GtfsDate } from '@/types.js';
import { type Holiday, type YearPeriod } from '@tmlmobilidade/go-types-offer';
import { type OperationalDate, OperationalDateIntSchema, validateOperationalDate } from '@tmlmobilidade/go-types-shared';
import { Dates, getOperationalDatesFromRange } from '@tmlmobilidade/go-utils-dates';

/* * */

/**
 * Get the Hitouch period ID for a given period.
 * @param period - The period to get the Hitouch period ID for.
 * @returns The Hitouch period ID.
 */
function getHitouchPeriodId(period?: YearPeriod): GtfsDate['period'] {
	if (period?.code === '3' || period?._id === 'UW2U0' || period?.name?.toLowerCase().includes('verão')) return '3';
	if (period?.code === '2' || period?._id === '2KIUJ' || period?.name?.toLowerCase().includes('férias')) return '2';
	return '1';
}

/**
 * Build a map of dates to GtfsDate objects.
 * @param dateRange - The date range to build the map for.
 * @param holidays - The holidays to build the map for.
 * @param periods - The periods to build the map for.
 * @returns A map of dates to GtfsDate objects.
 */
export function buildDatesMap(dateRange: { end: OperationalDate, start: OperationalDate }, holidays: Holiday[], periods: YearPeriod[]): Map<OperationalDate, GtfsDate> {
	//

	//
	// Build maps of holidays and periods by date

	const holidayByDate = new Map<OperationalDate, string[]>();
	const periodByDate = new Map<OperationalDate, YearPeriod>();

	for (const holiday of holidays) {
		for (const date of holiday.dates) {
			const holidayNames = holidayByDate.get(date) ?? [];
			holidayNames.push(holiday.title);
			holidayByDate.set(date, holidayNames);
		}
	}

	for (const period of periods) {
		for (const date of period.dates ?? []) {
			periodByDate.set(date, period);
		}
	}

	const datesMap = new Map<OperationalDate, GtfsDate>();

	for (const dateInt of getOperationalDatesFromRange(OperationalDateIntSchema.parse(dateRange.start), OperationalDateIntSchema.parse(dateRange.end))) {
		const date = validateOperationalDate(String(dateInt));
		const holidayNames = holidayByDate.get(date) ?? [];
		const holiday = holidayNames.length > 0;
		const weekday = Dates.fromOperationalDateInt(dateInt, 'Europe/Lisbon').toFormat('c');

		const dayType: GtfsDate['day_type'] = holiday || weekday === '7'
			? '3'
			: weekday === '6'
				? '2'
				: '1';

		datesMap.set(date, {
			date,
			day_type: dayType,
			holiday: holiday ? '1' : '0',
			notes: holidayNames.join(' / '),
			period: getHitouchPeriodId(periodByDate.get(date)),
		});
	}

	return datesMap;
}
