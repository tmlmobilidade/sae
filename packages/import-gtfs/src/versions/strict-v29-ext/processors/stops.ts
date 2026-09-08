/* * */

import { type GtfsStrictV29ExtStops, GtfsStrictV29ExtStopsSchema } from '@tmlmobilidade/go-types-gtfs-strict';
import { streamCsvFile } from '@tmlmobilidade/go-utils-exec';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { type ImportGtfsContext } from '../../../shared/init-context.js';
import { type GtfsStrictV29ExtSQLTables } from '../types.js';

/**
 * Processes the stops.txt file from the GTFS dataset.
 * include all of them since we don't have a way to filter them yet like trips/routes/shapes.
 * By saving all of them, we also speed up the processing of each stop_time by including the stop data right away.
 * @param context The import GTFS context containing references to SQL tables and other metadata.
 */
export async function processGtfsStrictV29ExtStops(context: ImportGtfsContext<GtfsStrictV29ExtSQLTables>): Promise<void> {
	try {
		//

		const stopsParseTimer = new Timer();

		Logger.info({ message: 'Reading zip entry "stops.txt"...' });

		const parseEachRow = async (data: GtfsStrictV29ExtStops) => {
			// Validate the current row against the proper type
			const validatedData = GtfsStrictV29ExtStopsSchema.parse(data);
			// Skip if stop already exists
			if (context.gtfs.stops.get('stop_id', validatedData.stop_id)) return;
			// Save the exported row
			context.gtfs.stops.write(validatedData);
		};

		//
		// Setup the CSV parsing operation

		await streamCsvFile(`${context.workdir.extract_dir_path}/stops.txt`, parseEachRow);

		context.gtfs.stops.flush();

		Logger.success(`Finished processing "stops.txt": ${context.gtfs.stops.size} rows saved in ${stopsParseTimer.get()}.`, 1);

		//
	} catch (error) {
		Logger.error({ error, message: `Error processing "stops.txt" file: ${error.message}` });
		throw new Error('✖︎ Error processing "stops.txt" file.', error);
	}
}
