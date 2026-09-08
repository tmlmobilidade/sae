/* * */

import { type ChangeStreamDocument } from '@tmlmobilidade/go-clients-mongo';
import { type RideWithAnalyses } from '@tmlmobilidade/go-types-operation';
import { Logger } from '@tmlmobilidade/logger';
import { ZodError } from 'zod';

import { ridesWriter } from '../utils/writers.js';

/**
 * Process the Ride document by validating the operation type,
 * transforming the document, and writing it to the Rides collection.
 * Additionally, publish heartbeats for each agency after processing the document.
 * @param ride The Ride document to be processed.
 * @returns A promise that resolves when the Ride document has been processed.
 */
export async function processRide(databaseOperation: ChangeStreamDocument<RideWithAnalyses>) {
	//

	//
	// Transform the APEX Banking Tap document into a SimplifiedApexBankingTap
	// and write it to the database, using a batch writer.

	try {
		let parseResult: null | SimplifiedApexBankingTap = null;
		if (databaseOperation.fullDocument.version === 'banking-tap-4.0') parseResult = parseRawApexTransactionBankingTapV40IntoSimplifiedApexBankingTap(databaseOperation.fullDocument);
		if (!parseResult) return;
		await writer.write(parseResult, { flushCallback: setRidesAsWaiting });
	} catch (error) {
		const errorMessage = error instanceof ZodError
			? error.issues.map(issue => `${issue.path.join('.')} ${issue.message}`).join('; ')
			: error instanceof Error ? error.message : String(error);
		Logger.error({ message: `Error transforming APEX Banking Tap: ${databaseOperation.fullDocument.transaction.transactionId}: Reason: ${errorMessage}` });
	}

	//
};
