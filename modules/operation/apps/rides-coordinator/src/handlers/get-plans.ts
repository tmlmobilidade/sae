/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type RidesCoordinatorPlansResponse } from '@tmlmobilidade/go-operation-pckg-types';
import { setPlanStatus } from '@tmlmobilidade/go-operation-pckg-utils';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { releaseStuckPlans } from '../utils/release-stuck-plans.js';

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
			Logger.info({ message: `[${sessionId}] Waiting for another request to complete... (elapsed: ${timer.get()})` });
			return { plan_id: null };
		}

		//
		// Set the busy flag to prevent other requests
		// from being processed until the current one is done.

		IS_BUSY = true;

		//
		// Release stuck plans before fetching new ones

		await releaseStuckPlans();

		//
		// Find the next Plan that is waiting to be processed.
		// Sort the query by descending date to prioritize the most recent Plans.

		const fetchTimer = new Timer();

		const foundWaitingPlans = await goDb.operation.plans.findMany(
			{
				'$expr': { $ne: ['$hash', '$apps.rides_feeder.last_hash'] },
				'apps.rides_feeder.status': { $nin: ['processing', 'error'] },
			},
			{
				limit: 1,
				projection: { _id: 1 },
				sort: { active_from: -1 },
			},
		);

		/* === FOR TESTING === */
		// const latestWaitingRides = await rides.findMany({ _id: 'DC0XN-44-20250303-4412_0_2|300|1955' })
		/* === FOR TESTING === */

		const fetchTimerResult = fetchTimer.get();

		if (!foundWaitingPlans.length) {
			Logger.info({ message: `[${sessionId}] No plans waiting (fetch: ${fetchTimerResult})` });
			IS_BUSY = false;
			return { plan_id: null };
		}

		//
		// Mark the Plan as 'processing' to ensure the next batch of Plans does not include it,
		// and return them to the caller instance.

		const markTimer = new Timer();

		await setPlanStatus(foundWaitingPlans[0]._id, 'rides_feeder', 'processing');

		Logger.info({ message: `[${sessionId}] New plan: ${foundWaitingPlans[0]._id} (fetch: ${fetchTimerResult} | total: ${markTimer.get()})` });

		//
		// Reset the busy flag to allow other requests to be processed
		// and return the Plan ID to the caller instance.

		IS_BUSY = false;

		return { plan_id: foundWaitingPlans[0]._id };

		//
	} catch (error) {
		Logger.error({ error, message: `[${sessionId}] Error getting plans: ${error.message}` });
		IS_BUSY = false;
		return { plan_id: null };
	}
}
