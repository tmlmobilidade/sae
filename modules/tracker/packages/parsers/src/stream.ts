/* * */

import { type ChangeStreamInsertDocument } from '@tmlmobilidade/go-clients-mongo';
import { type RawVehicleEvent, type SimplifiedVehicleEvent } from '@tmlmobilidade/go-types-vehicle-events';
import { type BatchWriter } from '@tmlmobilidade/go-utils-exec';
import { Logger } from '@tmlmobilidade/logger';

import { PARSER_MAP } from './parsers.js';

/* * */

interface HandleStreamRawVehicleEventIntoSimplifiedVehicleEventParams {

	/**
	 * The batch writer to be used to write the SimplifiedVehicleEvent
	 * documents to the SimplifiedVehicleEvents collection.
	 */
	batchWriter: BatchWriter<SimplifiedVehicleEvent>

	/**
	 * The database operation containing the Vehicle Event document
	 * to be processed into a SimplifiedVehicleEvent document.
	 */
	databaseOperation: ChangeStreamInsertDocument<RawVehicleEvent>

	/**
	 * The callback to be called when the SimplifiedVehicleEvent document is flushed.
	 */
	flushCallback: (data: SimplifiedVehicleEvent[]) => Promise<void>
}

/**
 * Parse the RawVehicleEvent document into a SimplifiedVehicleEvent document
 * by validating the operation type, transforming the document, and writing it
 * to the SimplifiedVehicleEvents collection.
 * @param params The parameters for the function.
 * @returns A promise that resolves when the RawVehicleEvent document has been
 * parsed into a SimplifiedVehicleEvent document.
 */
export async function handleStreamRawVehicleEventIntoSimplifiedVehicleEvent({ batchWriter, databaseOperation, flushCallback }: HandleStreamRawVehicleEventIntoSimplifiedVehicleEventParams) {
	try {
		//

		//
		// Extract the full document from the database operation and transform it
		// into a simplified vehicle event document using the appropriate parser based on the version field.

		const parser = PARSER_MAP[databaseOperation.fullDocument.version];
		if (!parser) throw new Error(`No parser found for version ${databaseOperation.fullDocument.version}. Skipping document with _id "${databaseOperation.fullDocument._id}"...`);

		const newSimplifiedVehicleEventDocument = await parser(databaseOperation.fullDocument);
		if (!newSimplifiedVehicleEventDocument) throw new Error(`Failed to parse document with _id "${databaseOperation.fullDocument._id}". Skipping...`);

		//
		// Write the new vehicle event document to the SimplifiedVehicleEvents collection

		await batchWriter.write(newSimplifiedVehicleEventDocument, { flushCallback });

		//
	} catch (error) {
		Logger.error({ error, message: `Parsing failed: _id="${databaseOperation.fullDocument._id}" version="${databaseOperation.fullDocument.version}"` });
	}
};
