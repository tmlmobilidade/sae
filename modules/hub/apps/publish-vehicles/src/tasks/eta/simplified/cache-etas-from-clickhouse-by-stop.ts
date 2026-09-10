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
 * Rebuilds the per-stop simplified ETA cache from ClickHouse.
 *
 * Runs `select-eta-by-stop.sql`, which returns one pre-aggregated JSON blob
 * of trip-stop ETAs per stop, then writes each to
 * `hub:v1:realtime:eta:by-stop:{stopId}`.
 *
 * Use this for the main ClickHouse-sourced ETA pipeline (full replace).
 * For merging in-memory `TripStopEta[]` from an external feed (e.g. CP), use
 * {@link cacheEtasByStop} instead.
 */
export async function cacheEtasFromClickHouseByStop() {
	//

	const timer = new Timer();

	Logger.info({ message: 'Retrieving trip stop ETAs grouped by stop from ClickHouse...' });

	const etasByStop = await labDb.queryFromFile<ClickHouseEtaKeyValue>(pipelinePath('select-eta-by-stop.sql'));

	await Promise.all(etasByStop.map(row => cacheDb.set(`hub:v1:realtime:eta:by-stop:${row.key}`, row.value, TTL_REALTIME)));

	Logger.info({ message: `Cached ${etasByStop.length} stop ETA groups in ${timer.get()}`, spacesAfterOrBefore: 1 });

	//
};
