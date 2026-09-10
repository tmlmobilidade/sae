/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { rawDb } from '@tmlmobilidade/go-interfaces-rawdb';
import { setRidesAsWaiting } from '@tmlmobilidade/go-tracker-pckg-callback';
import { parseRawVehicleEventPtTmlFertagusV1 } from '@tmlmobilidade/go-tracker-pckg-parsers';
import { type RawVehicleEventPtTmlFertagusV1, type SimplifiedVehicleEvent } from '@tmlmobilidade/go-types-vehicle-events';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { BatchWriter } from '@tmlmobilidade/go-utils-exec';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';

/* * */

const AGENCY_ID = '7NTB1';

const writer = new BatchWriter<SimplifiedVehicleEvent>({
	batch_size: 1_000,
	batch_timeout: 250,
	idle_timeout: 250,
	insertFn: async (data) => {
		await labDb.operation.simplifiedVehicleEvents.insert('JSONEachRow', data);
	},
	title: `pt-tml-fertagus-rawdb-stream`,
});

const ridesMap = new Map<string, string>();

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
async function findTripId(event: RawVehicleEventPtTmlFertagusV1['payload']): Promise<null | string> {
	if (!event.startsAt || !event.stop_id_start || !event.stop_id_end) return null;

	const rideKey = `${event.stop_id_start}-${event.stop_id_end}-${event.startsAt}`;
	const cached = ridesMap.get(rideKey);
	if (cached) return cached;

	const startTimeScheduled = Dates.fromISO(event.startsAt).unix_milliseconds;

	const foundRides = await labDb.queryFromFile<{ trip_id: string }>(sqlPath('tracker', 'pt-tml-fertagus-rawdb-stream/find-trip-id.sql'), {
		agency_id: AGENCY_ID,
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

/* * */

(async function init() {
	//

	// Initialize Sentry

	try {
		await initSentryNode();
		Logger.startNodeLogs({ app: 'pt-tml-fertagus-rawdb-stream', message: 'Sentry Tracker Fertagus LabDb Stream initialized', module: 'tracker', severity: 'info' });
	} catch (error) {
		Logger.error({ error, message: 'Error initializing Sentry Tracker Fertagus LabDb Stream' });
	}

	//
	// Watch for changes to the raw Fertagus collection
	// and transform those documents into SimplifiedVehicleEvents.

	const collection = await rawDb.vehicleEvents.ptTmlFertagus.getCollection();

	collection
		.watch([{ $match: { operationType: 'insert' } }])
		.on('change', async (change) => {
			//

			if (change.operationType !== 'insert' || !change.fullDocument) {
				Logger.error({ message: `[pt-tml-fertagus-rawdb-stream] WARNING: unexpected changeStream document: operationType="${change.operationType}"` });
				return;
			}

			try {
				const tripId = await findTripId(change.fullDocument.payload);
				if (!tripId) return;

				const simplified = parseRawVehicleEventPtTmlFertagusV1(change.fullDocument, tripId);
				if (!simplified) return;

				await writer.write(simplified, { flushCallback: setRidesAsWaiting });
			} catch (error) {
				console.error(error);
				Logger.error({ error, message: `[pt-tml-fertagus-rawdb-stream] Failed to transform document _id="${change.fullDocument._id}"` });
			}
		});
})();
