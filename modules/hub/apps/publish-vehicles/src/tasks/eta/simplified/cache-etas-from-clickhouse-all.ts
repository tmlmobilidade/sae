/* * */

import { cacheDb } from '@tmlmobilidade/go-interfaces-cachedb';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { type TripStopEta } from '../types.js';
import { getClickHouseEtas } from './get-clickhouse-etas.js';
import { TTL_REALTIME } from '@/config.js';

/* * */

/**
 * Rebuilds the full simplified ETA list cache from ClickHouse.
 *
 * Fetches all trip-stop ETAs via {@link getClickHouseEtas} and writes them to
 * `hub:v1:realtime:eta:all`.
 *
 * Use this for the main ClickHouse-sourced ETA pipeline (full replace).
 * For merging in-memory `TripStopEta[]` from an external feed (e.g. CP) into
 * the same key, use {@link cacheEtasInAll} instead.
 *
 * @returns The ClickHouse ETAs that were written to cache
 */
export async function cacheAllEtasFromClickHouse(): Promise<TripStopEta[]> {
	//

	const timer = new Timer();

	const etas = await getClickHouseEtas();

	await cacheDb.set('hub:v1:realtime:eta:all', JSON.stringify(etas), TTL_REALTIME);

	Logger.info({ message: `Cached ${etas.length} trip stop ETAs in ${timer.get()}`, spacesAfterOrBefore: 1 });

	return etas;

	//
};
