/* * */

import { type ExportToHitouchConfig } from '@/types.js';
import { yieldToEventLoop } from '@/utils/yield-to-event-loop.js';
import { GtfsTripsSchema } from '@tmlmobilidade/go-types-gtfs';
import { type GtfsStrictV29ExtSQLTables } from '@tmlmobilidade/import-gtfs';
import { Logger } from '@tmlmobilidade/logger';
import { CsvWriter } from '@tmlmobilidade/writers';

/* * */

export async function exportTripsFile(sqlTables: GtfsStrictV29ExtSQLTables, exportConfig: ExportToHitouchConfig, routeIds: ReadonlyMap<string, string>) {
	//
	// Export trips.txt

	const tripsCsv = new CsvWriter('trips.txt', `${exportConfig.workdir}/trips.txt`, { batch_size: 10000 });
	let exportedRows = 0;

	for (const tripData of sqlTables.trips.all('ORDER BY trip_id ASC')) {
		const routeId = routeIds.get(tripData.route_id);
		if (!routeId) throw new Error(`Cannot export trip ${tripData.trip_id}: route ${tripData.route_id} was not exported.`);

		const data = GtfsTripsSchema.parse({
			direction_id: tripData.direction_id,
			route_id: routeId,
			service_id: tripData.service_id,
			shape_id: tripData.shape_id,
			trip_headsign: tripData.trip_headsign,
			trip_id: tripData.trip_id,
			wheelchair_accessible: tripData.wheelchair_accessible ?? '0',
		});
		await tripsCsv.write(data);
		exportedRows++;
		await yieldToEventLoop(exportedRows);
	}

	await tripsCsv.flush();

	Logger.info({ message: 'Exported trips.txt file.' });
}
