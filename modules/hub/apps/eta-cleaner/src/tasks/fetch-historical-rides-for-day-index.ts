/* * */

import { AppConfig } from '@/lib/config.js';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { Logger } from '@tmlmobilidade/logger';

/* * */

/**
 * Ride `_id`s currently considered in-window for `eta.hist_rides` cleanup.
 * Matches the loader's historical window: `[now − daysBack − standardWindowHours, now − standardWindowHours]`.
 */
export async function fetchHistoricalRidesForDayIndex() {
	const end = Dates.now('Europe/Lisbon').minus({ hours: Dates.standardWindowHours });
	const start = Dates.now('Europe/Lisbon').minus({
		days: AppConfig.historicalDataDaysBack,
		hours: Dates.standardWindowHours,
	});

	Logger.progress({ message: `Getting historical rides for date range: ${start.iso} → ${end.iso}` });

	return await labDb.queryFromString<{ _id: string }>(
		`
			SELECT _id
			FROM operation.rides FINAL
			WHERE start_time_scheduled >= $1
			  AND start_time_scheduled <= $2
			ORDER BY start_time_scheduled ASC
		`,
		{
			1: start.unix_milliseconds,
			2: end.unix_milliseconds,
		},
	);
}
