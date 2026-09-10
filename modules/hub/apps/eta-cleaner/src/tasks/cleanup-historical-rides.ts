import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';
import { Logger } from '@tmlmobilidade/logger';

const KEEP_TABLE = 'eta._cleaner_hist_rides_keep';
const CLEANUP_HIST_RIDES_SQL = sqlPath('hub', 'eta/cleanup/4-delete-out-of-window-hist-rides.sql');

interface CleanupRowsResult {
	rows_to_delete: number
}

/**
 * Removes rows from `eta.hist_rides` whose `_id` is not present in
 * `keepRideIds` — the set `operation.rides` currently considers in-window
 * (same historical window the loader inserts).
 *
 * `keepRideIds` is staged into a dedicated table (`eta._cleaner_hist_rides_keep`)
 * rather than bound as `query_params`, because ClickHouse passes parameters
 * through the request URL and large arrays trip "HTTP request URI invalid
 * or too long". The staging table is truncated and repopulated every run.
 */
export async function cleanupHistoricalRides(keepRideIds: string[]) {
	Logger.title('4. Cleanup out-of-window historical rides');

	if (keepRideIds.length === 0) {
		// Safety net: an empty keep list would delete every row in hist_rides.
		Logger.progress({ message: 'No historical rides found in current window; skipping cleanup to avoid wiping eta.hist_rides' });
		return 0;
	}

	await labDb.command({
		query: `CREATE TABLE IF NOT EXISTS ${KEEP_TABLE} (_id String) ENGINE = MergeTree() ORDER BY _id`,
	});
	await labDb.command({ query: `TRUNCATE TABLE ${KEEP_TABLE}` });
	await labDb.insert({
		format: 'JSONEachRow',
		table: KEEP_TABLE,
		values: keepRideIds.map(_id => ({ _id })),
	});

	const result = await labDb.queryEachStatementFromFile<CleanupRowsResult>(
		CLEANUP_HIST_RIDES_SQL,
	);

	const rowsToDelete = result[0]?.rows_to_delete ?? 0;
	Logger.progress({ message: `Deleted ${rowsToDelete} out-of-window historical rides` });
	return rowsToDelete;
}
