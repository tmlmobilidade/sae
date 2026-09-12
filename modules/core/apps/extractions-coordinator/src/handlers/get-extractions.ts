/* * */

import { type ExtractionsCoordinatorResponse } from '@tmlmobilidade/go-core-pckg-types';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/* * */

let IS_BUSY = false;

/* * */

export async function getExtractionsHandler(): Promise<ExtractionsCoordinatorResponse> {
	//

	const timer = new Timer();
	const sessionId = Math.random().toString(36).substring(2, 5).toUpperCase();

	try {
		//

		//
		// The whole point of a coordinator is to prevent multiple instances
		// from processing the same documents at the same time. For that reason,
		// we need to make sure that instances request the next batch of documents
		// sequentially. To do that, we implement a simple lock mechanism.

		if (IS_BUSY) {
			Logger.info({ message: `[extractions] [${sessionId}] Waiting for another request to complete...` });
			return { extraction_id: null };
		}

		//
		// Set the busy flag to prevent other requests
		// from being processed until the current one is done.

		IS_BUSY = true;

		//
		// Release stuck extractions before fetching new ones

		const extractionsCollection = await goDb.core.extractions.getCollection();

		const updateResult = await extractionsCollection.updateMany(
			{
				processing_status: 'processing',
				updated_at: { $lt: Dates.now('utc').minus({ minutes: 3 }).unix_milliseconds },
			},
			{
				$set: {
					processing_status: 'waiting',
					updated_at: Dates.now('utc').unix_milliseconds,
				},
			},
		);

		Logger.info({ message: `[extractions] [${sessionId}] Released ${updateResult.modifiedCount} stuck extractions. (${timer.get()})` });

		//
		// Find the next Extraction that is waiting to be processed.
		// Sort the query by descending date to prioritize the most recent Extractions.

		const foundWaitingExtractions = await goDb.core.extractions.findMany(
			{
				processing_status: 'waiting',
			},
			{
				limit: 1,
				projection: { _id: 1 },
				sort: { created_at: 1 },
			},
		);

		/* === FOR TESTING === */
		// const foundWaitingExtractions = await goDb.core.extractions.findMany({ _id: '7NAYB' })
		/* === FOR TESTING === */

		if (!foundWaitingExtractions.length) {
			Logger.info({ message: `[extractions] [${sessionId}] No extractions waiting to be processed (${timer.get()})` });
			IS_BUSY = false;
			return { extraction_id: null };
		}

		//
		// Mark the Extraction as 'processing' to ensure the next batch of Extractions does not include it,
		// and return them to the caller instance.

		await goDb.core.extractions.updateById(foundWaitingExtractions[0]._id, { processing_status: 'processing' });

		Logger.info({ message: `[extractions] [${sessionId}] Waiting extraction found: "${foundWaitingExtractions[0]._id}" (${timer.get()})` });

		//
		// Reset the busy flag to allow other requests to be processed
		// and return the Extraction ID to the caller instance.

		IS_BUSY = false;

		return { extraction_id: foundWaitingExtractions[0]._id };

		//
	} catch (error) {
		Logger.error({ error, message: `[extractions] [${sessionId}] Error getting extractions: ${error.message}` });
		IS_BUSY = false;
		return { extraction_id: null };
	}
}
