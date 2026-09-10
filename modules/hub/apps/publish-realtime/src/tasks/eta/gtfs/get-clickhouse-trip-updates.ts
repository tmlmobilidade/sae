/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type GtfsRtTripUpdate } from '@tmlmobilidade/go-types-gtfs-rt';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { type ClickHouseEtaGtfsResponse } from '../types.js';

/* * */

export async function getClickHouseTripUpdates(): Promise<GtfsRtTripUpdate[]> {
	//

	const timer = new Timer();

	Logger.info({ message: 'Retrieving Estimated Time of Arrivals from ClickHouse...' });

	const allTripUpdates = await labDb.queryFromFile<ClickHouseEtaGtfsResponse>(sqlPath('hub', 'publish-realtime/select-eta-gtfs.sql'));

	const tripUpdates: GtfsRtTripUpdate[] = allTripUpdates.map(row => JSON.parse(row.trip_update));

	Logger.info({ message: `Found ${allTripUpdates.length} trip updates in ${timer.get()}`, spacesAfterOrBefore: 1 });

	//

	return tripUpdates;
};
