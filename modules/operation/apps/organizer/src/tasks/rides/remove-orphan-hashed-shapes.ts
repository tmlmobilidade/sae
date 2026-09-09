/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/**
 * Delete all Ride Analyses from Rides that do not exist anymore.
 */
export async function removeOrphanHashedShapesTask() {
	//

	const timer = new Timer();

	Logger.spacer(1);
	Logger.info({ message: `Starting cleanup of orphan Hashed Shapes...` });

	await labDb.command({
		query: `
			ALTER TABLE operation.hashed_shapes
			DELETE WHERE _id NOT IN (
				SELECT hashed_shape_id
				FROM operation.rides
			);
		`,
	});

	Logger.success(`Deleted orphan Hashed Shapes. (${timer.get()})`);

	Logger.spacer(1);
}
