/* * */

import { type ExportToHitouchConfig } from '@/types.js';
import { type GtfsStopTimes } from '@tmlmobilidade/go-types-gtfs';
import { type GtfsStrictV29ExtSQLTables } from '@tmlmobilidade/import-gtfs';
import { Logger } from '@tmlmobilidade/logger';
import { CsvWriter } from '@tmlmobilidade/writers';

/* * */

export async function exportStopTimesFile(sqlTables: GtfsStrictV29ExtSQLTables, exportConfig: ExportToHitouchConfig) {
	//
	// Export calendar-related files

	const stopTimesCsv = new CsvWriter('stop_times.txt', `${exportConfig.workdir}/stop_times.txt`, { batch_size: 100000 });

	for await (const stopTimeData of sqlTables.stop_times.stream()) {
		const data: GtfsStopTimes = {
			arrival_time: stopTimeData.arrival_time,
			departure_time: stopTimeData.departure_time,
			drop_off_type: stopTimeData.drop_off_type,
			pickup_type: stopTimeData.pickup_type,
			shape_dist_traveled: stopTimeData.shape_dist_traveled,
			stop_id: stopTimeData.stop_id,
			stop_sequence: stopTimeData.stop_sequence,
			timepoint: stopTimeData.timepoint,
			trip_id: stopTimeData.trip_id,
		};
		await stopTimesCsv.write(data);
	}

	await stopTimesCsv.flush();

	Logger.info({ message: 'Exported stop_times.txt file.' });
}
