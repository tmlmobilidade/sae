/* * */

import { type GtfsStrictV29Trips, GtfsStrictV29TripsSchema } from '@tmlmobilidade/go-types-gtfs-strict';
import { streamCsvFile } from '@tmlmobilidade/go-utils-exec';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { type ImportGtfsContext } from '../../../shared/init-context.js';
import { type GtfsStrictV29SQLTables } from '../types.js';

/**
 * Processes the trips.txt file from the GTFS dataset.
 * It filters trips based on the previously saved calendar dates.
 * @param context The import GTFS context containing references to SQL tables and other metadata.
 */
export async function processGtfsStrictV29Trips(context: ImportGtfsContext<GtfsStrictV29SQLTables>): Promise<void> {
	try {
		//

		const tripsParseTimer = new Timer();

		Logger.info({ message: 'Reading zip entry "trips.txt"...' });

		const parseEachRow = async (data: GtfsStrictV29Trips) => {
			// Validate the current row against the proper type
			const validatedData = GtfsStrictV29TripsSchema.parse(data);
			// For each trip, check if the associated service_id was saved
			// in the previous step or not. Include it if yes, skip otherwise.
			if (!context.gtfs.calendar_dates[validatedData.service_id]) return;
			// Save the exported row
			context.gtfs.trips.write(validatedData);
			// Reference the associated entities to filter them later.
			context.referenced_route_ids.add(validatedData.route_id);
			context.referenced_shape_ids.add(validatedData.shape_id);
			// Log progress
			if (context.counters.trips % 10000 === 0) Logger.info({ message: `Parsed ${context.counters.trips} trips.txt rows so far (${tripsParseTimer.get()})` });
			// Increment the counter
			context.counters.trips++;
		};

		//
		// Setup the CSV parsing operation

		await streamCsvFile(`${context.workdir.extract_dir_path}/trips.txt`, parseEachRow);

		context.gtfs.trips.flush();

		Logger.success(`Finished processing "trips.txt": ${context.gtfs.trips.size} rows saved in ${tripsParseTimer.get()}.`, 1);

		//
	} catch (error) {
		Logger.error({ error, message: `Error processing "trips.txt" file: ${error.message}` });
		throw new Error('✖︎ Error processing "trips.txt" file.', error);
	}
}
