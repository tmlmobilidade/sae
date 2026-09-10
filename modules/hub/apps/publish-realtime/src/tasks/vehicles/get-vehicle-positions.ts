/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type HubV1ApiVehiclePosition } from '@tmlmobilidade/go-types-hub';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';

/* * */

const SECONDS_AGO = 90;
const BEARING_INFERENCE_LOOKBACK_SECONDS = 300;

/**
 * Retrieves the latest vehicle positions from the database.
 * This function executes a SQL query to fetch the latest vehicle positions from the database.
 * It returns an array of `HubV1ApiVehiclePosition` objects.
 * @returns Array of `HubV1ApiVehiclePosition` objects.
 */
export async function getVehiclePositions(): Promise<HubV1ApiVehiclePosition[]> {
	return labDb.queryFromFile<HubV1ApiVehiclePosition>(
		sqlPath('hub', 'publish-realtime/select-vehicle-positions.sql'),
		{
			bearingInferenceLookbackSeconds: BEARING_INFERENCE_LOOKBACK_SECONDS,
			secondsAgo: SECONDS_AGO,
			stdWindowHours: Dates.standardWindowHours,
		},
	);
}
