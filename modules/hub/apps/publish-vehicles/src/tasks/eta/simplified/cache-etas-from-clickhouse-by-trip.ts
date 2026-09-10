/* * */

import { pipelinePath } from '@tmlmobilidade/go-hub-pckg-sql';
import { cacheDb } from '@tmlmobilidade/go-interfaces-cachedb';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { type ClickHouseEtaKeyValue } from '../types.js';
import { TTL_REALTIME } from '@/config.js';

/* * */

/**
 * Rebuilds the per-trip simplified ETA cache from ClickHouse.
 *
 * Runs `select-eta-by-trip.sql`, which returns one pre-aggregated JSON blob
 * of trip-stop ETAs per trip, then writes each to
 * `hub:v1:realtime:eta:by-trip:{tripId}`.
 *
 * Use this for the main ClickHouse-sourced ETA pipeline (full replace).
 * For writing in-memory `TripStopEta[]` from an external feed (e.g. CP), use
 * {@link cacheEtasByTrip} instead.
 */
export async function cacheEtasFromClickHouseByTrip() {
	//

	const timer = new Timer();

	Logger.info({ message: 'Retrieving trip stop ETAs grouped by trip from ClickHouse...' });

	const etasByTrip = await labDb.queryFromFile<ClickHouseEtaKeyValue>(pipelinePath('select-eta-by-trip.sql'));

	await Promise.all(etasByTrip.map(row => cacheDb.set(`hub:v1:realtime:eta:by-trip:${row.key}`, row.value, TTL_REALTIME)));

	Logger.info({ message: `Cached ${etasByTrip.length} trip ETA groups in ${timer.get()}`, spacesAfterOrBefore: 1 });

	//
};
