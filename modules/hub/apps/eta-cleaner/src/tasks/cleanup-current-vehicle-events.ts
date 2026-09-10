import { AppConfig } from '@/lib/config.js';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';
import { Logger } from '@tmlmobilidade/logger';

const CLEANUP_CURRENT_VEHICLE_EVENTS_SQL = sqlPath('hub', 'eta/cleanup/2-delete-out-of-window-curr-vehicle-events.sql');

interface CleanupRowsResult {
	rows_to_delete: number
}

export async function cleanupCurrentVehicleEvents() {
	Logger.title('3. Cleanup current window vehicle events');

	const result = await labDb.queryEachStatementFromFile<CleanupRowsResult>(
		CLEANUP_CURRENT_VEHICLE_EVENTS_SQL,
		{ window_hours_before: AppConfig.windowHoursBefore },
	);

	const rowsToDelete = result[0]?.rows_to_delete ?? 0;
	Logger.progress({ message: `Deleted ${rowsToDelete} out-of-window or orphan current vehicle events` });
	return rowsToDelete;
}
