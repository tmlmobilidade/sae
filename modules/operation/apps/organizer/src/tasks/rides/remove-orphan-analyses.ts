/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { RideAnalysesRegistrySchema } from '@tmlmobilidade/go-types-operation';
import { runWithConcurrency } from '@tmlmobilidade/go-utils-exec';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/**
 * Delete all Ride Analyses from Rides that do not exist anymore.
 */
export async function removeOrphanAnalysesTask() {
	//

	const timer = new Timer();

	Logger.spacer(1);
	Logger.info({ message: `Starting cleanup of orphan Ride Analyses...` });

	const rideAnalysisTables = Object
		.keys(RideAnalysesRegistrySchema.shape)
		.map(table => `operation.ride_analysis_${table}`);

	await runWithConcurrency(rideAnalysisTables, rideAnalysisTables.length, async (table) => {
		//

		const foundOperationalDates = await labDb.queryFromString<{ operational_date: number }>(`
			SELECT DISTINCT operational_date
			FROM ${table}
			ORDER BY operational_date ASC
		`);

		Logger.info({ message: `Found ${foundOperationalDates.length} operational dates for ${table}` });

		await runWithConcurrency(foundOperationalDates, 10, async (item) => {
			await labDb.command({
				query: `
					ALTER TABLE ${table}
					DELETE WHERE operational_date = ${item.operational_date}
					AND ride_id NOT IN (
						SELECT _id
						FROM operation.rides
						WHERE operational_date = ${item.operational_date}
					);
				`,
			});
		});

		Logger.info({ message: `Deleted orphan Ride Analyses from ${table}.` });
	});

	Logger.success(`Deleted orphan Ride Analyses. (${timer.get()})`);
	Logger.spacer(1);
}
