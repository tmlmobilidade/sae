/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type RidesCoordinatorPlansResponse } from '@tmlmobilidade/go-operation-pckg-types';
import { setPlanStatus } from '@tmlmobilidade/go-operation-pckg-utils';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/* * */

let IS_BUSY = false;

/* * */

export async function getPlansHandler(): Promise<RidesCoordinatorPlansResponse> {
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
			Logger.info({ message: `[plans] [${sessionId}] Waiting for another request to complete...` });
			return { plan_id: null };
		}

		//
		// Set the busy flag to prevent other requests
		// from being processed until the current one is done.

		IS_BUSY = true;

		//
		// Release stuck plans before fetching new ones

		const plansCollection = await goDb.operation.plans.getCollection();

		const updateResult = await plansCollection.updateMany(
			{
				'apps.rides_feeder.status': 'processing',
				'apps.rides_feeder.timestamp': { $lt: Dates.now('utc').minus({ minutes: 3 }).unix_milliseconds },
			},
			{
				$set: {
					'apps.rides_feeder.last_hash': null,
					'apps.rides_feeder.status': 'waiting',
					'apps.rides_feeder.timestamp': Dates.now('utc').unix_milliseconds,
				},
			},
		);

		Logger.info({ message: `[plans] [${sessionId}] Released ${updateResult.modifiedCount} stuck plans. (${timer.get()})` });

		//
		// Find the next Plan that is waiting to be processed.
		// Sort the query by descending date to prioritize the most recent Plans.

		const foundWaitingPlans = await goDb.operation.plans.findMany(
			{
				'$expr': { $ne: ['$hash', '$apps.rides_feeder.last_hash'] },
				'apps.rides_feeder.status': { $nin: ['processing', 'error'] },
				'attachments.operation_gtfs_normalized': { $ne: null },
			},
			{
				limit: 1,
				projection: { _id: 1 },
				sort: { active_from: -1 },
			},
		);

		/* === FOR TESTING === */
		// const foundWaitingPlans = await goDb.operation.plans.findMany({ _id: 'DC0XN-44-20250303-4412_0_2|300|1955' })
		/* === FOR TESTING === */

		if (!foundWaitingPlans.length) {
			Logger.info({ message: `[plans] [${sessionId}] No plans waiting to be processed (${timer.get()})` });
			IS_BUSY = false;
			return { plan_id: null };
		}

		//
		// Mark the Plan as 'processing' to ensure the next batch of Plans does not include it,
		// and return them to the caller instance.

		await setPlanStatus(foundWaitingPlans[0]._id, 'rides_feeder', 'processing');

		Logger.info({ message: `[plans] [${sessionId}] Waiting plan found: "${foundWaitingPlans[0]._id}" (${timer.get()})` });

		//
		// Reset the busy flag to allow other requests to be processed
		// and return the Plan ID to the caller instance.

		IS_BUSY = false;

		return { plan_id: foundWaitingPlans[0]._id };

		//
	} catch (error) {
		Logger.error({ error, message: `[plans] [${sessionId}] Error getting plans: ${error.message}` });
		IS_BUSY = false;
		return { plan_id: null };
	}
}
