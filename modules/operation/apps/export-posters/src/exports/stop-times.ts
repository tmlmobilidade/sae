/* * */

import { type ExportToHitouchConfig } from '@/types.js';
import { buildVariantNotes } from '@/utils/build-variant-notes.js';
import { yieldToEventLoop } from '@/utils/yield-to-event-loop.js';
import { GtfsStopTimesSchema } from '@tmlmobilidade/go-types-gtfs';
import { type GtfsStrictV29ExtSQLTables } from '@tmlmobilidade/import-gtfs';
import { Logger } from '@tmlmobilidade/logger';
import { CsvWriter } from '@tmlmobilidade/writers';

/* * */

export async function exportStopTimesFile(sqlTables: GtfsStrictV29ExtSQLTables, exportConfig: ExportToHitouchConfig) {
	//
	// Export stop times and annotations using the final trip IDs from calendar processing.

	const stopTimesCsv = new CsvWriter('stop_times.txt', `${exportConfig.workdir}/stop_times.txt`, { batch_size: 100000 });
	const stopTimesExtCsv = new CsvWriter('stop_timesExt.txt', `${exportConfig.workdir}/stop_timesExt.txt`, { batch_size: 100000, include_bom: true, new_line_character: '\r\n' });
	const { tripNotes: variantNotes } = buildVariantNotes(sqlTables.trips.all());
	const extensionFields = ['trip_id', 'stop_id', 'stop_sequence', 'billboard_importance', 'billboard_alignment_id', 'route_stop_sequence', 'index', 'note'] as const;
	let previousTripId: string | undefined;
	let routeStopSequence = 0;
	let annotationsCount = 0;
	let exportedRows = 0;

	for (const stopTimeData of sqlTables.stop_times.all('ORDER BY trip_id ASC, stop_sequence ASC')) {
		if (stopTimeData.trip_id !== previousTripId) {
			previousTripId = stopTimeData.trip_id;
			routeStopSequence = 0;
		}
		routeStopSequence++;
		const data = GtfsStopTimesSchema.parse({
			arrival_time: stopTimeData.arrival_time,
			departure_time: stopTimeData.departure_time,
			drop_off_type: stopTimeData.drop_off_type,
			pickup_type: stopTimeData.pickup_type,
			shape_dist_traveled: stopTimeData.shape_dist_traveled,
			stop_id: stopTimeData.stop_id,
			stop_sequence: stopTimeData.stop_sequence,
			timepoint: stopTimeData.timepoint,
			trip_id: stopTimeData.trip_id,
		});
		await stopTimesCsv.write(data);
		exportedRows++;
		await yieldToEventLoop(exportedRows);

		const annotation = variantNotes.get(stopTimeData.trip_id);
		if (!annotation) continue;
		const extension = {
			stop_id: stopTimeData.stop_id,
			stop_sequence: stopTimeData.stop_sequence,
			trip_id: stopTimeData.trip_id,
			// Leave billboard selection/alignment to the canvas; this file adds annotations only.
			billboard_alignment_id: '',
			billboard_importance: '',
			index: annotation.index,
			note: annotation.note,
			route_stop_sequence: routeStopSequence,
		};
		await stopTimesExtCsv.write(Object.fromEntries(extensionFields.map(field => [field, extension[field]])));
		annotationsCount++;
	}

	await stopTimesCsv.flush();
	await stopTimesExtCsv.flush();

	Logger.info({ message: 'Exported stop_times.txt file.' });
	Logger.info({ message: annotationsCount ? `Exported ${annotationsCount} variant annotations in stop_timesExt.txt.` : 'Skipped stop_timesExt.txt because no variant annotations were found.' });
}
