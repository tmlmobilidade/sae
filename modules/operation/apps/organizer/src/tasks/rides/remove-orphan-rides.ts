/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/**
 * Delete all Rides from Plans that do not exist anymore.
 */
export async function removeOrphanRidesTask() {
	//

	const timer = new Timer();

	Logger.spacer(1);
	Logger.info({ message: `Starting cleanup of orphan Rides...` });

	const allPlanIds = await goDb.operation.plans.distinct('_id');

	if (!allPlanIds.length) {
		Logger.info({ message: `No plans found. No rides deleted.` });
		return;
	}

	const result = await goDb.operation.rides.deleteMany({ plan_id: { $nin: allPlanIds } });

	Logger.success(`Deleted ${result.deletedCount} orphan Rides from Plans that do not exist anymore. (${timer.get()})`);
	Logger.spacer(1);
}
