/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type FileExport, type VehicleExportProperties } from '@tmlmobilidade/go-types-downloads';
import { Logger } from '@tmlmobilidade/logger';
import { generateRandomString } from '@tmlmobilidade/strings';
import { Timer } from '@tmlmobilidade/timer';
import { CsvWriter } from '@tmlmobilidade/writers';
import os from 'os';
import path from 'path';

import { parseVehicles, type VehicleExportCsvData } from './lib/parse-vehicles.js';

/* * */

function getVehicleIdsFromExportProperties(properties: VehicleExportProperties['properties']): string[] {
	const vehicleIds = properties.vehicle_ids ?? [];
	return [...new Set(vehicleIds.filter(Boolean))];
}

/* * */

/**
 * Exports a batch of vehicles to a CSV file.
 * @param fileExport The file export object.
 * @returns The path to the exported file.
 */
export async function exportVehiclesFile(fileExport: FileExport): Promise<string> {
	//

	if (fileExport.type !== 'vehicle') throw new Error(`File export type is not vehicle: ${fileExport.type}.`);

	if (!fileExport.properties) throw new Error('File export properties is missing.');

	//
	// Setup a timer to track the execution time
	const timer = new Timer();

	await goDb.core.exports.updateById(fileExport._id, { processing_status: 'processing' });

	//
	// Build vehicle ids from export properties
	const properties = fileExport.properties as VehicleExportProperties['properties'];
	const vehicleIds = getVehicleIdsFromExportProperties(properties);

	const vehiclesCollection = await goDb.operation.vehicles.getCollection();
	const vehiclesCursor = vehiclesCollection.find({ _id: { $in: vehicleIds } }, { batchSize: 5000 });

	//
	// Write the vehicles batch to the file
	const tempFilePath = path.join(os.tmpdir(), `${fileExport.file_name}_${generateRandomString()}.csv`);
	const csvWriter = new CsvWriter<VehicleExportCsvData>(fileExport.file_name, tempFilePath, { batch_size: 10000, include_bom: true });

	let count = 0;
	for await (const vehicle of vehiclesCursor) {
		await csvWriter.write(parseVehicles({ vehicle }));
		count++;
	}

	await csvWriter.flush();

	Logger.success(`Exported ${count} vehicles in ${timer.get()}`, 1);
	Logger.info({ message: `File path: ${tempFilePath}` });
	Logger.spacer(1);

	return tempFilePath;
}
