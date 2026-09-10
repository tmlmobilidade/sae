/* * */

import { pipelinePath } from '@tmlmobilidade/go-hub-pckg-sql';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { type TripStopEta } from '../types.js';

/* * */

/**
 * Fetches all simplified trip-stop ETAs from ClickHouse (`select-eta.sql`).
 *
 * Used by {@link cacheAllEtasFromClickHouse} to rebuild `hub:v1:realtime:eta:all`.
 */
export async function getClickHouseEtas(): Promise<TripStopEta[]> {
	//

	const timer = new Timer();

	Logger.info({ message: 'Retrieving trip stop ETAs from ClickHouse...' });

	const etas = await labDb.queryFromFile<TripStopEta>(pipelinePath('select-eta.sql'));

	Logger.info({ message: `Found ${etas.length} trip stop ETAs in ${timer.get()}`, spacesAfterOrBefore: 1 });

	return etas;

	//
};
