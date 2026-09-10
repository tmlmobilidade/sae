import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { Logger } from '@tmlmobilidade/logger';

const CLEANUP_HIST_NODE_TRAVEL_TIMES_SQL = 'eta/cleanup/6-delete-orphan-hist-node-travel-times.sql';

interface CleanupRowsResult {
	rows_to_delete: number
}

/**
 * Removes rows from `eta.hist_node_travel_times` whose parent ride no
 * longer exists in `eta.hist_rides`. Must run AFTER `cleanupHistoricalRides`
 * so the orphan predicate (`ride_id NOT IN (SELECT _id FROM eta.hist_rides)`)
 * is evaluated against the pruned ride set.
 */
export async function cleanupHistoricalNodeTravelTimes() {
	Logger.title('6. Cleanup orphan historical node travel times');

	const result = await labDb.queryEachStatementFromFile<CleanupRowsResult>(
		CLEANUP_HIST_NODE_TRAVEL_TIMES_SQL,
	);

	const rowsToDelete = result[0]?.rows_to_delete ?? 0;
	Logger.progress({ message: `Deleted ${rowsToDelete} orphan historical node travel times` });
	return rowsToDelete;
}
