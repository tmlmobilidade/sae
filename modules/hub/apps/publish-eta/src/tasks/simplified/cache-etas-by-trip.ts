/* * */

import { cacheDb } from '@tmlmobilidade/go-interfaces-cachedb';

import { type TripStopEta } from '../types.js';
import { groupEtasByTrip } from './trip-updates-to-etas.js';
import { TTL_REALTIME } from '@/config.js';

/* * */

/**
 * Writes in-memory trip-stop ETAs into the per-trip simplified ETA cache.
 *
 * Groups by `trip_id` and overwrites
 * `hub:v1:realtime:eta:by-trip:{tripId}` with the sorted ETA list as JSON.
 *
 * Use this for external feeds that produce `TripStopEta[]` in process (e.g. CP).
 * For a full rebuild from ClickHouse SQL, use
 * {@link cacheEtasFromClickHouseByTrip} instead.
 *
 * @param etas - Trip-stop ETAs to write into the trip-keyed cache
 */
export async function cacheEtasByTrip(etas: TripStopEta[]) {
	//

	await Promise.all([...groupEtasByTrip(etas).entries()].map(async ([tripId, tripEtas]) => {
		const sorted = [...tripEtas].sort((a, b) => a.stop_sequence - b.stop_sequence);
		await cacheDb.set(`hub:v1:realtime:eta:by-trip:${tripId}`, JSON.stringify(sorted), TTL_REALTIME);
	}));

	//
};
