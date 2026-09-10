import { AppConfig } from '@/lib/config.js';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { Logger } from '@tmlmobilidade/logger';

const CLEANUP_CURRENT_RIDES_SQL = 'eta/cleanup/1-delete-out-of-window-curr-rides.sql';

interface CleanupRowsResult {
	rows_to_delete: number
}

export async function cleanupCurrentRides() {
	Logger.title('1. Cleanup current window rides');

	const result = await labDb.queryEachStatementFromFile<CleanupRowsResult>(
		CLEANUP_CURRENT_RIDES_SQL,
		{ window_hours_before: AppConfig.windowHoursBefore },
	);

	const rowsToDelete = result[0]?.rows_to_delete ?? 0;
	Logger.progress({ message: `Deleted ${rowsToDelete} out-of-window current rides` });
	return rowsToDelete;
}
