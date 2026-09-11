/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type RawVehicleEventPtTmlFertagusV1 } from '@tmlmobilidade/go-types-vehicle-events';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';
import { Logger } from '@tmlmobilidade/logger';

/* * */

/**
 * Finds the trip ID for a given Fertagus vehicle event payload.
 *
 * Attempts to retrieve the corresponding trip ID from the cache, or queries the database if needed.
 * Logs errors if no ride or multiple rides are found for the given event parameters.
 *
 * @param {RawVehicleEventPtTmlFertagusV1['payload']} event - The vehicle event payload to find the trip ID for.
 * @returns {Promise<string | null>} The trip ID if found and unique, otherwise null.
*/
export async function findTripId(event: RawVehicleEventPtTmlFertagusV1['payload']): Promise<null | string> {
	if (!event.startsAt || !event.stop_id_start || !event.stop_id_end) return null;
	const ridesMap = new Map<string, string>();

	const rideKey = `${event.stop_id_start}-${event.stop_id_end}-${event.startsAt}`;
	const cached = ridesMap.get(rideKey);
	if (cached) return cached;

	const startTimeScheduled = Dates.fromISO(event.startsAt).unix_milliseconds;

	const foundRides = await labDb.queryFromFile<{ trip_id: string }>(sqlPath('tracker', 'pt-tml-fertagus-rawdb-stream/find-trip-id.sql'), {
		agency_id: '7NTB1',
		first_stop_id: event.stop_id_start,
		last_stop_id: event.stop_id_end,
		start_time_scheduled: startTimeScheduled,
	});

	if (foundRides.length === 0) {
		Logger.error({ message: `[pt-tml-fertagus-rawdb-stream] No ride found for event start time scheduled: ${startTimeScheduled} - ${event.stop_id_start} -> ${event.stop_id_end}.` });
		return null;
	}

	if (foundRides.length > 1) {
		Logger.error({ message: `[pt-tml-fertagus-rawdb-stream] Multiple rides found for event start time scheduled: ${startTimeScheduled} - ${event.stop_id_start} -> ${event.stop_id_end}.` });
		return null;
	}

	ridesMap.set(rideKey, foundRides[0].trip_id);
	return foundRides[0].trip_id;
}
