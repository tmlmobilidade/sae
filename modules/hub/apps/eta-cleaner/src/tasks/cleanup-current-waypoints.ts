import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { Logger } from '@tmlmobilidade/logger';

const CLEANUP_CURRENT_WAYPOINTS_SQL = 'eta/cleanup/3-delete-orphan-curr-waypoints.sql';

interface CleanupRowsResult {
	rows_to_delete: number
}

export async function cleanupCurrentWaypoints() {
	Logger.title('2. Cleanup current window waypoints');

	const result = await labDb.queryEachStatementFromFile<CleanupRowsResult>(
		CLEANUP_CURRENT_WAYPOINTS_SQL,
	);

	const rowsToDelete = result[0]?.rows_to_delete ?? 0;
	Logger.progress({ message: `Deleted ${rowsToDelete} orphan current waypoints` });
	return rowsToDelete;
}
