/* * */

import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/**
 * Delete all HashedShapes that are not referenced by any Ride.
 */
export async function removeOrphanHashedShapesTask() {
	//

	const timer = new Timer();

	Logger.spacer(1);
	Logger.info({ message: `Starting cleanup of orphan Hashed Shapes...` });

	// TODO: Replace with goDb query
	// await labDb.operation.hashedShapes.delete('_id NOT IN (SELECT DISTINCT hashed_shape_id FROM operation.simplified_rides)');

	Logger.success(`Hashed Shapes cleanup complete. Deleted orphan Hashed Shapes. (${timer.get()})`);
}
