/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type RidesCoordinatorRidesResponse } from '@tmlmobilidade/go-operation-pckg-types';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/* * */

let IS_BUSY = false;

/* * */

export async function getRidesHandler(): Promise<RidesCoordinatorRidesResponse> {
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

		while (IS_BUSY) {
			Logger.info({ message: `[rides] [${sessionId}] Waiting for another request to complete...` });
			return { ride_ids: [] };
		}

		//
		// Set the busy flag to prevent other requests
		// from being processed until the current one is done.

		IS_BUSY = true;

		//
		// Release stuck rides before fetching new ones

		const ridesCollection = await goDb.operation.rides.getCollection();

		const updateResult = await ridesCollection.updateMany(
			{
				processing_status: 'processing',
				updated_at: { $lt: Dates.now('utc').minus({ minutes: 3 }).unix_milliseconds },
			},
			{
				$set: { processing_status: 'waiting' },
			},
		);

		Logger.info({ message: `[rides] [${sessionId}] Released ${updateResult.modifiedCount} stuck rides. (${timer.get()})` });

		//
		// Find all Ride IDs that are waiting analysis and which started before the current time,
		// sorted in descending order to prioritize the most recent Rides.

		const standardWindowInterval = Dates.now('utc').std_window;

		const foundWaitingRides = await goDb.operation.rides.findMany(
			{
				processing_status: 'waiting',
				start_time_scheduled: { $lte: standardWindowInterval.end },
			},
			{
				limit: 750,
				projection: { _id: 1, operational_date: 1, start_time_scheduled: 1 },
				sort: { start_time_scheduled: -1 },
			},
		);

		/* === FOR TESTING === */
		// const foundWaitingRides = await goDb.operation.rides.findMany({ _id: '2QDAD-43-20260908-3003_0_2_1130_1159_0_VER_DU' });
		/* === FOR TESTING === */

		if (!foundWaitingRides.length) {
			Logger.info({ message: `[rides] [${sessionId}] No rides waiting to be processed. | stdWindowEnd = ${standardWindowInterval.end} (${timer.get()})` });
			return { ride_ids: [] };
		}

		//
		// Mark those Rides as 'processing' to ensure the next batch of Rdes does not include them,
		// and return them to the caller instance.

		const foundWaitingRidesIds = foundWaitingRides.map(item => item._id);

		ridesCollection.updateMany({ _id: { $in: foundWaitingRidesIds } }, {
			$set: {
				processing_status: 'processing',
				updated_at: Dates.now('utc').unix_milliseconds,
			},
		});

		Logger.info({ message: `[rides] [${sessionId}] New batch of ${foundWaitingRidesIds.length} rides. | operational_date: ${foundWaitingRides[foundWaitingRides.length - 1].operational_date} | start_time_scheduled: ${foundWaitingRides[foundWaitingRides.length - 1].start_time_scheduled} (${timer.get()})` });

		return { ride_ids: foundWaitingRidesIds };

		//
	} catch (error) {
		Logger.error({ error, message: `[${sessionId}] Error getting rides: ${error.message}` });
		return { ride_ids: [] };
	} finally {
		IS_BUSY = false;
	}
}
