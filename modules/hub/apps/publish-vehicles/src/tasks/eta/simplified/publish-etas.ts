/* * */

import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { EXTERNAL_FEEDS } from '../external-feeds.js';
import { cacheEtasByStop } from './cache-etas-by-stop.js';
import { cacheEtasByTrip } from './cache-etas-by-trip.js';
import { cacheAllEtasFromClickHouse } from './cache-etas-from-clickhouse-all.js';
import { cacheEtasFromClickHouseByStop } from './cache-etas-from-clickhouse-by-stop.js';
import { cacheEtasFromClickHouseByTrip } from './cache-etas-from-clickhouse-by-trip.js';
import { cacheEtasByAll } from './cache-etas-by-all.js';
import { getExternalEtas } from './get-external-etas.js';

/* * */

/**
 * Publishes the simplified (non-GTFS) trip-stop ETA caches.
 *
 * Rebuilds `eta:all`, `eta:by-trip:*`, and `eta:by-stop:*` from ClickHouse.
 * External feeds can later merge into those same keys via
 * {@link cacheEtasByTrip}, {@link cacheEtasByStop}, and {@link cacheEtasInAll}.
 */
export async function publishEtas() {
	//

	Logger.title('Publishing trip stop ETAs...');

	const globalTimer = new Timer();

	// Rebuild ETA caches from ClickHouse SQL aggregations
	await cacheAllEtasFromClickHouse();
	await cacheEtasFromClickHouseByTrip();
	await cacheEtasFromClickHouseByStop();

	for (const feed of EXTERNAL_FEEDS) {
		const etas = await getExternalEtas(feed);
		await cacheEtasByTrip(etas);
		await cacheEtasByStop(etas);
		await cacheEtasByAll(etas);
	}

	Logger.success(`Finished publishing trip stop ETAs (${globalTimer.get()})`);

	//
};
