/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type FileExport, type StopExportProperties } from '@tmlmobilidade/go-types-downloads';
import { Logger } from '@tmlmobilidade/logger';
import { generateRandomString } from '@tmlmobilidade/strings';
import { Timer } from '@tmlmobilidade/timer';
import { CsvWriter } from '@tmlmobilidade/writers';
import os from 'os';
import path from 'path';

import { parseStops, type StopExportCsvData } from './lib/parse-stops.js';

/* * */

function getStopIdsFromExportProperties(properties: StopExportProperties['properties']): number[] {
	const stopIds = properties.stop_ids ?? [];
	return [...new Set(stopIds.map(Number).filter(id => !Number.isNaN(id)))];
}

/* * */

/**
 * Exports a batch of stops to a CSV file.
 * @param fileExport - The file export object.
 * @returns The path to the exported file.
 */
export async function exportStopsFile(fileExport: FileExport): Promise<string> {
	//

	if (fileExport.type !== 'stop') throw new Error(`File export type is not stop: ${fileExport.type}.`);

	if (!fileExport.properties) throw new Error('File export properties is missing.');

	//
	// Setup a timer to track the execution time
	const timer = new Timer();

	await goDb.core.exports.updateById(fileExport._id, { processing_status: 'processing' });

	//
	// Build stop ids from export properties
	const properties = fileExport.properties as StopExportProperties['properties'];
	const stopIds = getStopIdsFromExportProperties(properties);

	const stopsCollection = await goDb.infrastructure.stops.getCollection();
	const stopsCursor = stopsCollection.find({ _id: { $in: stopIds } }, { batchSize: 5000 });
	const municipalityIds = await stopsCollection.distinct('municipality_id', { _id: { $in: stopIds } });
	const municipalitiesList = await goDb.locations.municipalities.findMany(
		{ _id: { $in: municipalityIds } },
		{ projection: { _id: 1, properties: 1 } },
	);
	const municipalitiesMap = new Map(municipalitiesList.map(municipality => [municipality._id, municipality.name]));

	//
	// Write the stops batch to the file
	const tempFilePath = path.join(os.tmpdir(), `${fileExport.file_name}_${generateRandomString()}.csv`);
	const csvWriter = new CsvWriter<StopExportCsvData>(fileExport.file_name, tempFilePath, { batch_size: 10000, include_bom: true });

	let count = 0;
	for await (const stop of stopsCursor) {
		await csvWriter.write(parseStops({
			_id: stop._id,
			municipality_name: municipalitiesMap.get(stop.municipality_id) ?? null,
			stop,
		}));
		count++;
	}

	await csvWriter.flush();

	Logger.success(`Exported ${count} stops in ${timer.get()}`, 1);
	Logger.info({ message: `File path: ${tempFilePath}` });
	Logger.spacer(1);

	return tempFilePath;
}
