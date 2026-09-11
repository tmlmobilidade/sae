/* * */

import { externalClients } from '@tmlmobilidade/external';
import { rawDb } from '@tmlmobilidade/go-interfaces-rawdb';
import { type HashableRawVehicleEvent, type RawVehicleEventPtTmlTcbV1 } from '@tmlmobilidade/go-types-vehicle-events';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';
import crypto from 'node:crypto';

/* * */

let ITERATION = 0;

/* * */

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'pt-tml-tcb-api-fetch', message: 'Sentry Tracker TCB Fetch initialized', module: 'tracker', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Tracker TCB Fetch' });
}

const main = async () => {
	//

	//
	// Initialize the timer

	const timer = new Timer();

	let saveCount = 0;

	//
	// Fetch the TCB Vehicle Events data from the API and decode it

	Logger.info({ message: `[${ITERATION}] Fetching TCB data from API...`, spacesAfterOrBefore: 1, spacesBefore: 0 });

	const decodedMessage = await externalClients.tcb.vehiclePositions();

	Logger.info({ message: `[${ITERATION}] Found ${decodedMessage.entity?.length ?? 0} Vehicle Events in the TCB data.` });

	//
	// Transform each message into a RawVehicleEvent

	const candidateEvents: Array<{ _id: string, document: RawVehicleEventPtTmlTcbV1 }> = [];

	for (const entity of decodedMessage.entity ?? []) {
		try {
		//

			if (!entity.vehicle?.trip) continue;

			const timestampSeconds = entity.vehicle.timestamp ?? decodedMessage.header.timestamp;

			//
			// Hash the relevant fields of the vehicle event
			// to create a unique identifier for the event.
			// This allows us to identify duplicate events
			// and avoid storing them multiple times in the database.

			const hashableRawEvent: HashableRawVehicleEvent<RawVehicleEventPtTmlTcbV1> = {
				agency_id: 'A3H3M',
				created_at: Dates.fromSeconds(timestampSeconds).unix_milliseconds,
				entity_id: entity.id,
				payload: {
					header: {
						...decodedMessage.header,
						timestamp: timestampSeconds,
					},
					vehicle: entity.vehicle,
				},
				version: 'pt-tml-tcb-v1',
			};

			const hashableRawEventId = crypto
				.createHash('sha256')
				.update(JSON.stringify(hashableRawEvent))
				.digest('hex');

			candidateEvents.push({
				_id: hashableRawEventId,
				document: {
					...hashableRawEvent,
					_id: hashableRawEventId,
					received_at: Dates.now('Europe/Lisbon').unix_milliseconds,
				},
			});

		//
		} catch (error) {
			Logger.error({ error, message: `[${ITERATION}] Error processing vehicle event entity with ID ${entity.id}:` });
		}
	}

	//
	// Save the new vehicle events to the database

	if (candidateEvents.length > 0) {
		try {
			const candidateIds = candidateEvents.map(event => event._id);
			const existingDocs = await rawDb.vehicleEvents.ptTmlTcb.findMany(
				{ _id: { $in: candidateIds } },
				{ projection: { _id: 1 } },
			);
			const existingIds = new Set(existingDocs.map(doc => doc._id));

			const newEvents = candidateEvents.filter(event => !existingIds.has(event._id));

			if (newEvents.length > 0) {
				await rawDb.vehicleEvents.ptTmlTcb.insertMany(newEvents.map(event => event.document));
				saveCount = newEvents.length;
			}
		} catch (error) {
			Logger.error({ error, message: `[${ITERATION}] Error saving vehicle events to database:` });
		}
	}

	Logger.info({ message: `[${ITERATION}] Saved ${saveCount} new Vehicle Events from TCB data in ${timer.get()}.` });

	ITERATION++;

	//
};

/* * */

await runOnInterval(main, { intervalMs: '10s', throwOnError: true });
