/* * */
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';

import { processRide } from './tasks/rides.js';

/* * */

//
// Initialize Sentry
try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'raw-stream', message: 'Sentry APEX Raw Stream initialized', module: 'apex', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry APEX Raw Stream' });
}

(async function init() {
	//

	Logger.init();

	//
	// Watch for changes to the RawApexTransactions collection
	// and process the documents immediately.

	const ridesCollection = await goDb.operation.rides.getCollection();

	// On insertion
	const insertionFilter = { operationType: 'insert' };

	// On Update
	const updateFilter = {
		operationType: 'update',
		// 'updateDescription.updatedFields.processing_status': {
		// 	$in: ['complete', 'error'],
		// },
	};

	//
	// Watch for changes to the rides collection

	ridesCollection
		.watch(
			[{ $match: { $or: [insertionFilter, updateFilter] } }],
			{ fullDocument: 'updateLookup' },
		)
		.on('change', processRide);

	//
})();
