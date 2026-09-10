/* * */

import { TTL_REALTIME } from '@/config.js';
import { pipelinePath } from '@tmlmobilidade/go-hub-pckg-sql';
import { cacheDb } from '@tmlmobilidade/go-interfaces-cachedb';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type GtfsRtTripUpdate } from '@tmlmobilidade/go-types-gtfs-rt';
import { getEmptyGtfsRtFeedMessage } from '@tmlmobilidade/gtfs-rt';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/* * */

/**
 * Writes the per-stop ETA Redis cache from ClickHouse Query Results.
 *
 * Runs `select-eta-by-stop-gtfs.sql`, which returns one JSON array of
 * TripUpdates per stop, wraps each as a GTFS-RT FeedMessage, then writes to
 * `hub:v1:realtime:eta:by-stop:{stopId}:gtfs`.
 *
 * Use this for the main ClickHouse-sourced ETA pipeline (full replace).
 * For merging in-memory TripUpdates from an external feed (e.g. CP), use
 * {@link cacheTripUpdatesByStop} instead.
 */
export async function cacheEtasFromClickHouseByStop() {
	//

	const timer = new Timer();

	Logger.info({ message: 'Retrieving GTFS-RT TripUpdates grouped by stop from ClickHouse...' });

	const tripUpdatesByStop = await labDb.queryFromFile<{ key: string, value: string }>(pipelinePath('select-eta-by-stop-gtfs.sql'));

	await Promise.all(tripUpdatesByStop.map((row) => {
		const tripUpdates = JSON.parse(row.value) as GtfsRtTripUpdate[];
		const feed = getEmptyGtfsRtFeedMessage();
		feed.entity = tripUpdates.map(tripUpdate => ({
			id: tripUpdate.trip.trip_id,
			trip_update: tripUpdate,
		}));
		return cacheDb.set(`hub:v1:realtime:eta:by-stop:${row.key}:gtfs`, JSON.stringify(feed), TTL_REALTIME);
	}));

	Logger.info({ message: `Cached ${tripUpdatesByStop.length} stop GTFS-RT groups in ${timer.get()}`, spacesAfterOrBefore: 1 });

	//
};
