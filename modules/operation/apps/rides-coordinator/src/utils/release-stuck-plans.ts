/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/* * */

const STUCK_PLAN_TIMEOUT_MS = 180_000; // 3 minutes

/* * */

export async function releaseStuckPlans() {
	//

	//
	// Initialize the logger

	Logger.init();

	const globalTimer = new Timer();

	//
	// Get all 'processing' plans from the database

	const fetchTimer = new Timer();

	const processingPlans = await goDb.operation.plans.findMany({ 'apps.rides_feeder.status': { $in: ['processing'] } });

	const stuckPlanIds = processingPlans
		.filter(plan => plan.apps.rides_feeder.timestamp < Dates.now('Europe/Lisbon').unix_milliseconds - STUCK_PLAN_TIMEOUT_MS)
		.map(plan => plan._id);

	Logger.info({ message: `Fetched ${processingPlans.length} 'processing' plans, of which ${stuckPlanIds.length} are stuck. (${fetchTimer.get()})` });

	//
	// Skip if no stuck plans found

	if (!stuckPlanIds.length) {
		Logger.info({ message: `No stuck plans found!` });
		return;
	}

	//
	// Mark the plans as 'waiting' to be reprocessed.

	Logger.info({ message: `Found ${stuckPlanIds.length} stuck plans that will be marked as 'waiting'.` });

	const plansCollection = await goDb.operation.plans.getCollection();

	await plansCollection.updateMany(
		{ _id: { $in: stuckPlanIds } },
		{
			$set: {
				'apps.rides_feeder.last_hash': null,
				'apps.rides_feeder.status': 'waiting',
				'apps.rides_feeder.timestamp': Dates.now('Europe/Lisbon').unix_milliseconds,
			},
		},
	);

	Logger.terminate(`Cleaned ${stuckPlanIds.length} stuck plans in ${globalTimer.get()}.`);
};
