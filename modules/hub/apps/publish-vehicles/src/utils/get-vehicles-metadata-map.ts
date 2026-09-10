/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type Vehicle } from '@tmlmobilidade/go-types-operation';
import { UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/* * */

let LOCAL_CACHE_DATA: Map<string, Vehicle> | null = null;
let LOCAL_CACHE_TIMESTAMP: null | UnixMilliseconds = null;

/**
 * Retrieves a map of vehicle metadata by agency ID and vehicle ID from the local cache or the database.
 * The local cache is updated every 10 minutes.
 * @returns A map of vehicle metadata by agency ID and vehicle ID.
 */
export async function getVehiclesMetadataMap(): Promise<Map<string, Vehicle>> {
	//

	//
	// If the local cache is still valid, return it immediately

	const cacheIsExpired = LOCAL_CACHE_TIMESTAMP < Dates.now('utc').minus({ minutes: 10 }).unix_milliseconds;

	if (!cacheIsExpired && LOCAL_CACHE_DATA && LOCAL_CACHE_DATA.size > 0) return LOCAL_CACHE_DATA;

	//
	// Otherwise, retrieve fresh data from the database

	const timer = new Timer();

	Logger.title('Retrieving fresh vehicle metadata from GoDB...');

	const foundVehicles = await goDb.operation.vehicles.findMany();

	const vehiclesMetadataMap = new Map<string, Vehicle>(foundVehicles.map(vehicle => [`${vehicle.agency_id}:${vehicle.vehicle_id}`, vehicle]));

	LOCAL_CACHE_DATA = vehiclesMetadataMap;
	LOCAL_CACHE_TIMESTAMP = Dates.now('utc').unix_milliseconds;

	Logger.info({ message: `Retrieved ${vehiclesMetadataMap.size} vehicles metadata in ${timer.get()}` });

	return vehiclesMetadataMap;
};
