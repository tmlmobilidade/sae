/* * */

import { TTL_REALTIME } from '@/config.js';
import { cacheDb } from '@tmlmobilidade/go-interfaces-cachedb';
import { type GtfsRtFeedMessage, type GtfsRtTripUpdate } from '@tmlmobilidade/go-types-gtfs-rt';
import { getEmptyGtfsRtFeedMessage } from '@tmlmobilidade/gtfs-rt';

/* * */

/**
 * Upserts in-memory GTFS-RT TripUpdates into the per-stop ETA cache.
 *
 * Splits each TripUpdate into one entry per `stop_time_update`, groups by
 * `stop_id`, then merges into the existing Redis FeedMessage at
 * `hub:v1:realtime:eta:by-stop:{stopId}:gtfs` (replace same entity `id`, append otherwise).
 *
 * Use this for external feeds that produce TripUpdate objects in process
 * (e.g. CP). For a full rebuild from ClickHouse SQL, use
 * {@link cacheEtasFromClickHouseByStop} instead.
 *
 * @param tripUpdates - TripUpdates to merge into the stop-keyed cache
 */
export async function cacheTripUpdatesByStop(tripUpdates: GtfsRtTripUpdate[]) {
	//

	const byStopUpdates = new Map<string, GtfsRtTripUpdate[]>();

	for (const tripUpdate of tripUpdates) {
		for (const stopTimeUpdate of tripUpdate.stop_time_update ?? []) {
			if (!stopTimeUpdate.stop_id) continue;

			const perStopTripUpdate: GtfsRtTripUpdate = {
				...tripUpdate,
				stop_time_update: [stopTimeUpdate],
			};
			const stopTripUpdates = byStopUpdates.get(stopTimeUpdate.stop_id) ?? [];
			stopTripUpdates.push(perStopTripUpdate);
			byStopUpdates.set(stopTimeUpdate.stop_id, stopTripUpdates);
		}
	}

	await Promise.all([...byStopUpdates.entries()].map(async ([stopId, updates]) => {
		const existing = await cacheDb.get(`hub:v1:realtime:eta:by-stop:${stopId}:gtfs`);
		const feed: GtfsRtFeedMessage = existing ? JSON.parse(existing) : getEmptyGtfsRtFeedMessage();

		for (const tripUpdate of updates) {
			const entity = { id: tripUpdate.trip.trip_id, trip_update: tripUpdate };
			const index = feed.entity.findIndex(e => e.id === entity.id);
			if (index >= 0) feed.entity[index] = entity;
			else feed.entity.push(entity);
		}

		await cacheDb.set(`hub:v1:realtime:eta:by-stop:${stopId}:gtfs`, JSON.stringify(feed), TTL_REALTIME);
	}));

	//
};
