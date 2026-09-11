/* * */

import { externalClients } from '@tmlmobilidade/external';
import { TrainsResponse } from '@tmlmobilidade/external/dist/clients/fertagus/types.js';
import { rawDb } from '@tmlmobilidade/go-interfaces-rawdb';
import { type HashableRawVehicleEvent, type RawVehicleEventPtTmlFertagusV1, RawVehicleEventPtTmlFertagusV1PayloadSchema } from '@tmlmobilidade/go-types-vehicle-events';
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
	Logger.startNodeLogs({ app: 'pt-tml-fertagus-api-fetch', message: 'Sentry Tracker Fertagus Fetch initialized', module: 'tracker', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Tracker Fertagus Fetch' });
}

const main = async () => {
	//

	//
	// Initialize the timer

	const timer = new Timer();
	let saveCount = 0;

	//
	// Fetch the Fertagus Vehicle Events data from API and persist each
	// train as-is. Ride matching and simplification happen downstream
	// in pt-tml-fertagus-rawdb-stream.

	Logger.info({ message: `[${ITERATION}] Fetching Fertagus data from API...`, spacesAfterOrBefore: 1, spacesBefore: 0 });

	let response: null | TrainsResponse;
	try {
		response = await externalClients.fertagus.trains();
	} catch (error) {
		Logger.error({ error, message: `[${ITERATION}] Error fetching Fertagus data from API:` });
		return;
	}

	Logger.info({ message: `[${ITERATION}] Found ${response.length ?? 0} Vehicle Events in the Fertagus data.` });

	for (const event of response ?? []) {
		try {
			//
			const result = RawVehicleEventPtTmlFertagusV1PayloadSchema.safeParse(event);
			if (!result.success) continue;

			const hashableRawEvent: HashableRawVehicleEvent<RawVehicleEventPtTmlFertagusV1> = {
				agency_id: '7NTB1',
				created_at: Dates.fromISO(event.date).unix_milliseconds,
				entity_id: `${event.date}-${event.train_id ?? ''}`,
				payload: event,
				version: 'pt-tml-fertagus-v1',
			};

			const hashableRawEventId = crypto
				.createHash('sha256')
				.update(JSON.stringify(hashableRawEvent))
				.digest('hex');

			const alreadyExists = await rawDb.vehicleEvents.ptTmlFertagus.findOne({ _id: hashableRawEventId });

			if (alreadyExists) continue;

			await rawDb.vehicleEvents.ptTmlFertagus.insertOne({
				...hashableRawEvent,
				_id: hashableRawEventId,
				received_at: Dates.now('Europe/Lisbon').unix_milliseconds,
			});

			saveCount++;

			//
		} catch (error) {
			Logger.error({ error, message: `[${ITERATION}] Error processing Fertagus event:` });
		}
	}

	Logger.info({ message: `[${ITERATION}] Saved ${saveCount} new Vehicle Events from Fertagus data in ${timer.get()}.` });

	ITERATION++;

	//
};

/* * */

await runOnInterval(main, { intervalMs: '5s', throwOnError: true });
