/* * */

import { processRawApexTransactionInspectionDecision } from '@/tasks/inspection-decisions.js';
import { processRawApexTransactionInspection } from '@/tasks/inspections.js';
import { processRawApexTransactionLocation } from '@/tasks/locations.js';
import { processRawApexTransactionRefund } from '@/tasks/refunds.js';
import { processRawApexTransactionBankingTap } from '@/tasks/rides.js';
import { processRawApexTransactionSale } from '@/tasks/sales.js';
import { processRawApexTransactionValidation } from '@/tasks/validations.js';
import { rawDb } from '@tmlmobilidade/go-interfaces-rawdb';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';

/* * */

(async function init() {
	//

	//
	// Initialize Sentry

	try {
		await initSentryNode();
		Logger.startNodeLogs({ app: 'raw-stream', message: 'Sentry APEX Raw Stream initialized', module: 'apex', severity: 'info' });
	} catch (error) {
		Logger.error({ error, message: 'Error initializing Sentry APEX Raw Stream' });
	}

	//

	Logger.init();

	//
	// Watch for changes to the RawApexTransactions collection
	// and process the documents immediately.

	const rawApexTransactionsCollection = await rawDb.apex.transactions.getCollection();

	rawApexTransactionsCollection
		.watch([{ $match: { 'fullDocument.version': { $in: ['banking-tap-4.0'] } } }])
		.on('change', processRawApexTransactionBankingTap);

	rawApexTransactionsCollection
		.watch([{ $match: { 'fullDocument.version': { $in: ['inspection-decision-2.0'] } } }])
		.on('change', processRawApexTransactionInspectionDecision);

	rawApexTransactionsCollection
		.watch([{ $match: { 'fullDocument.version': { $in: ['inspection-2.0'] } } }])
		.on('change', processRawApexTransactionInspection);

	rawApexTransactionsCollection
		.watch([{ $match: { 'fullDocument.version': { $in: ['location-3.0'] } } }])
		.on('change', processRawApexTransactionLocation);

	rawApexTransactionsCollection
		.watch([{ $match: { 'fullDocument.version': { $in: ['refund-3.0'] } } }])
		.on('change', processRawApexTransactionRefund);

	rawApexTransactionsCollection
		.watch([{ $match: { 'fullDocument.version': { $in: ['sale-3.0'] } } }])
		.on('change', processRawApexTransactionSale);

	rawApexTransactionsCollection
		.watch([{ $match: { 'fullDocument.version': { $in: ['validation-2.0', 'validation-3.0', 'validation-4.0', 'validation-5.0'] } } }])
		.on('change', processRawApexTransactionValidation);

	//
})();
