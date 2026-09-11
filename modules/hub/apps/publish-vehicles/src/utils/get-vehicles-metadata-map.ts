/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type HubV1ApiVehicleMetadata, HubV1ApiVehicleMetadataSchema } from '@tmlmobilidade/go-types-hub';
import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/* * */

let LOCAL_CACHE_DATA = new Map<string, HubV1ApiVehicleMetadata>();
let LOCAL_CACHE_TIMESTAMP: null | UnixMilliseconds = null;

/**
 * Retrieves a map of vehicle metadata by agency ID and vehicle ID from the local cache or the database.
 * The local cache is updated every 10 minutes.
 * @returns A map of vehicle metadata by agency ID and vehicle ID.
 */
export async function getVehiclesMetadataMap(): Promise<Map<string, HubV1ApiVehicleMetadata>> {
	//

	//
	// If the local cache is still valid, return it immediately

	const cacheIsExpired = LOCAL_CACHE_TIMESTAMP && LOCAL_CACHE_TIMESTAMP < Dates.now('utc').minus({ minutes: 10 }).unix_milliseconds;

	if (!cacheIsExpired && LOCAL_CACHE_DATA.size > 0) return LOCAL_CACHE_DATA;

	//
	// Otherwise, retrieve fresh data from the database

	const timer = new Timer();

	Logger.title('Retrieving fresh vehicle metadata from GoDB...');

	const foundVehicles = await goDb.operation.vehicles.findMany();

	LOCAL_CACHE_DATA = new Map<string, HubV1ApiVehicleMetadata>();

	foundVehicles.forEach((vehicle) => {
		const metadata = HubV1ApiVehicleMetadataSchema.safeParse({
			_id: vehicle._id,
			agency_id: vehicle.agency_id,
			available_seats: vehicle.available_seats,
			contactless: vehicle.contactless,
			license_plate: vehicle.license_plate,
			make: vehicle.make,
			model: vehicle.model,
			propulsion: vehicle.propulsion,
			registration_date: vehicle.registration_date,
			vehicle_id: vehicle.vehicle_id,
			vehicle_type: vehicle.typology,
			wheelchair: vehicle.wheelchair,
		});
		if (!metadata.success) return;
		LOCAL_CACHE_DATA.set(`${vehicle.agency_id}:${vehicle.vehicle_id}`, metadata.data);
	});

	LOCAL_CACHE_TIMESTAMP = Dates.now('utc').unix_milliseconds;

	Logger.info({ message: `Retrieved ${LOCAL_CACHE_DATA.size} vehicles metadata in ${timer.get()}` });

	return LOCAL_CACHE_DATA;
};
