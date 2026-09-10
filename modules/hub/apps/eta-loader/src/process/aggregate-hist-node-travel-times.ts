/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { performInTimeChunks } from '@tmlmobilidade/go-utils-exec';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';
import { Logger } from '@tmlmobilidade/logger';

/* * */

const SQL_PATH = sqlPath('hub', 'eta/loader/aggregate-hist-node-travel-times.sql');
const hourMs = 3_600_000;

/* * */

/**
 * Aggregates per-node travel times in `eta.hist_node_travel_times` into
 * operational-day buckets, one day at a time.
 *
 * Each chunk runs `aggregate-hist-node-travel-times.sql` over a scan window
 * around the operational day.
 *
 * @param windowStart - Inclusive start of the processing window.
 * @param windowEnd - Exclusive end of the processing window.
 */
export async function aggregateHistNodeTravelTimes(windowStart: UnixMilliseconds, windowEnd: UnixMilliseconds): Promise<void> {
	await performInTimeChunks({
		endDate: windowEnd,
		intervalHrs: 24,
		onChunk: async (chunk) => {
			const day = Dates.fromUnixMilliseconds(chunk.start).startOf('day');
			Logger.progress({ message: `[${chunk.index + 1}/${chunk.total}] operational day ${day.toFormat('yyyyMMdd')}` });
			await labDb.queryFromFile(SQL_PATH, {
				chunk_date: Number(day.toFormat('yyyyMMdd')),
				scan_end: day.unix_milliseconds + 42 * hourMs,
				scan_start: day.unix_milliseconds - 16 * hourMs,
			});
		},
		order: 'desc',
		startDate: windowStart,
	});
}
