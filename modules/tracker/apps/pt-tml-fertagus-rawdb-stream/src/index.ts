/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { rawDb } from '@tmlmobilidade/go-interfaces-rawdb';
import { setRidesAsWaiting } from '@tmlmobilidade/go-tracker-pckg-callback';
import { parseRawVehicleEventPtTmlFertagusV1 } from '@tmlmobilidade/go-tracker-pckg-parsers';
import { type SimplifiedVehicleEvent } from '@tmlmobilidade/go-types-vehicle-events';
import { BatchWriter } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';

/* * */

const writer = new BatchWriter<SimplifiedVehicleEvent>({
	batch_size: 1_000,
	batch_timeout: 250,
	idle_timeout: 250,
	insertFn: async (data) => {
		await labDb.operation.simplifiedVehicleEvents.insert('JSONEachRow', data);
	},
	title: `pt-tml-fertagus-rawdb-stream`,
});

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
				const simplified = await parseRawVehicleEventPtTmlFertagusV1(change.fullDocument);
				if (!simplified) return;

				await writer.write(simplified, { flushCallback: setRidesAsWaiting });
			} catch (error) {
				console.error(error);
				Logger.error({ error, message: `[pt-tml-fertagus-rawdb-stream] Failed to transform document _id="${change.fullDocument._id}"` });
			}
		});
})();
