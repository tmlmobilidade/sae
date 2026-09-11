/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type ExtractionWorkerResult, type InfrastructureStopsV1ExtractionProperties, InfrastructureStopsV1ExtractionPropertiesSchema } from '@tmlmobilidade/go-types-extractions';

/**
 * Exports a batch of stops to a CSV file.
 * @param fileExport - The file export object.
 * @returns The path to the exported file.
 */
export async function extractInfrastructureStopsV1(properties: InfrastructureStopsV1ExtractionProperties): Promise<ExtractionWorkerResult> {
	//

	//
	// Validate the received properties

	const validatedProperties = InfrastructureStopsV1ExtractionPropertiesSchema.parse(properties);

	//
	// Get the stops from the database

	const foundStops = await goDb.infrastructure.stops.findMany({
		municipality_id: { in: validatedProperties.municipality_ids },
	});

	//
	// Export the stops to a CSV file

	return {
		duration: null,
		path: 'stops.csv',
		size: 0,
	};
}
