/* * */

import { cacheDb } from '@tmlmobilidade/go-interfaces-cachedb';

import { type TripStopEta } from '../types.js';
import { groupEtasByStop } from './trip-updates-to-etas.js';

/* * */

/**
 * Upserts in-memory trip-stop ETAs into the per-stop simplified ETA cache.
 *
 * Groups by `stop_id`, then merges into the existing Redis value at
 * `hub:v1:realtime:eta:by-stop:{stopId}` (replace same trip+sequence, append otherwise).
 *
 * Use this for external feeds that produce `TripStopEta[]` in process (e.g. CP).
 * For a full rebuild from ClickHouse SQL, use
 * {@link cacheEtasFromClickHouseByStop} instead.
 *
 * @param etas - Trip-stop ETAs to merge into the stop-keyed cache
 */
export async function cacheEtasByStop(etas: TripStopEta[]) {
	//

	await Promise.all([...groupEtasByStop(etas).entries()].map(async ([stopId, stopEtas]) => {
		const existing = await cacheDb.get(`hub:v1:realtime:eta:by-stop:${stopId}`);
		const merged: TripStopEta[] = existing ? JSON.parse(existing) : [];

		for (const eta of stopEtas) {
			const index = merged.findIndex(row => row.trip_id === eta.trip_id && row.stop_sequence === eta.stop_sequence);
			if (index >= 0) merged[index] = eta;
			else merged.push(eta);
		}

		merged.sort((a, b) => a.stop_sequence - b.stop_sequence);

		await cacheDb.set(`hub:v1:realtime:eta:by-stop:${stopId}`, JSON.stringify(merged));
	}));

	//
};
