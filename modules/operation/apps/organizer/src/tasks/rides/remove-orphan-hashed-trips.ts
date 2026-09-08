/* * */

import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/**
 * Delete all HashedShapes that are not referenced by any Ride.
 */
export async function removeOrphanHashedTripsTask() {
	//

	const timer = new Timer();

	Logger.spacer(1);
	Logger.info({ message: `Starting cleanup of orphan Hashed Trips...` });

	// TODO: Replace with goDb query
	// await labDb.operation.hashedTrips.delete('_id NOT IN (SELECT DISTINCT hashed_trip_id FROM operation.simplified_rides)');

	Logger.success(`Hashed Trips cleanup complete. Deleted orphan Hashed Trips. (${timer.get()})`);
}
