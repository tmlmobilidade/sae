/* * */

import { pipelinePath } from '@tmlmobilidade/go-eta-pckg-common';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { performInTimeChunks } from '@tmlmobilidade/go-utils-exec';
import { Logger } from '@tmlmobilidade/logger';

/* * */

const SQL_PATH = 'eta/loader/build-hist-node-travel-times.sql';

/* * */

/**
 * Snaps historical vehicle events to shape nodes and writes per-node travel
 * times into `eta.hist_node_travel_times`, one day at a time.
 *
 * Each chunk runs `build-hist-node-travel-times.sql` over `{chunk_start, chunk_end}`.
 *
 * @param windowStart - Inclusive start of the processing window.
 * @param windowEnd - Exclusive end of the processing window.
 */
export async function buildHistNodeTravelTimes(windowStart: UnixMilliseconds, windowEnd: UnixMilliseconds): Promise<void> {
	await performInTimeChunks({
		endDate: windowEnd,
		intervalHrs: 24,
		onChunk: async (chunk) => {
			const start = Dates.fromUnixMilliseconds(chunk.start);
			const end = Dates.fromUnixMilliseconds(chunk.end);

			Logger.progress({
				message: `[${chunk.index + 1}/${chunk.total}] hist_node_travel_times ${start.iso} [${chunk.start}] → ${end.iso} [${chunk.end}]`,
			});

			await labDb.queryFromFile(pipelinePath(SQL_PATH), { chunk_end: chunk.end, chunk_start: chunk.start });
		},
		order: 'desc',
		startDate: windowStart,
	});
}
