import { AppConfig } from '@/lib/config.js';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';
import { Logger } from '@tmlmobilidade/logger';

const CLEANUP_HIST_NODE_TRAVEL_TIMES_AGG_SQL = sqlPath('hub', 'eta/cleanup/7-delete-out-of-window-hist-node-travel-times-aggregation.sql');

interface CleanupRowsResult {
	rows_to_delete: number
}

/**
 * Removes rows from `eta.hist_node_travel_times_aggregation` whose
 * `operational_date` predates the loader's historical window
 * (`historicalDataDaysBack` days back from today). The loader appends
 * to this table every run without dedup, so without pruning it grows
 * without bound.
 */
export async function cleanupHistoricalNodeTravelTimesAggregation() {
	Logger.title('7. Cleanup out-of-window historical node travel times aggregation');

	const result = await labDb.queryEachStatementFromFile<CleanupRowsResult>(
		CLEANUP_HIST_NODE_TRAVEL_TIMES_AGG_SQL,
		{ historical_data_days_back: AppConfig.historicalDataDaysBack },
	);

	const rowsToDelete = result[0]?.rows_to_delete ?? 0;
	Logger.progress({ message: `Deleted ${rowsToDelete} out-of-window historical node travel times aggregation rows` });
	return rowsToDelete;
}
