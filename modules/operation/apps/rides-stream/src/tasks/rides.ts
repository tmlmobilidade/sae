/* * */

import { type ChangeStreamDocument } from '@tmlmobilidade/go-clients-mongo';
import { type Ride } from '@tmlmobilidade/go-types-operation';
import { Logger } from '@tmlmobilidade/logger';
import { ZodError } from 'zod';

import {
	rideAnalysisAtLeastOneVehicleEventOnFirstStopWriter,
	rideAnalysisAtLeastOneVehicleEventOnLastStopWriter,
	rideAnalysisExpectedApexValidationIntervalWriter,
	rideAnalysisExpectedDriverIdQtyWriter,
	rideAnalysisExpectedStartTimeWriter,
	rideAnalysisExpectedVehicleEventDelayWriter,
	rideAnalysisExpectedVehicleEventIntervalWriter,
	rideAnalysisExpectedVehicleEventQtyWriter,
	rideAnalysisExpectedVehicleIdQtyWriter,
	rideAnalysisMatchingApexLocationsWriter,
	rideAnalysisMatchingVehicleIdsWriter,
	rideAnalysisSimpleOneApexValidationWriter,
	rideAnalysisSimpleOneVehicleEventOrApexValidationWriter,
	rideAnalysisSimpleThreeVehicleEventsWriter,
	rideAnalysisTransactionSequentialityWriter,
	ridesWriter,
} from '../utils/writers.js';

/**
 * Process the Ride document by validating the operation type,
 * transforming the document, and writing it to the Rides collection.
 * Additionally, publish heartbeats for each agency after processing the document.
 * @param ride The Ride document to be processed.
 * @returns A promise that resolves when the Ride document has been processed.
 */
export async function processRide(databaseOperation: ChangeStreamDocument<Ride>) {
	//

	//
	// Validate the database operation

	if ((databaseOperation.operationType !== 'insert' && databaseOperation.operationType !== 'update') || !databaseOperation.fullDocument) {
		Logger.error({ message: `[rides-stream] WARNING: unexpected changeStream document: operationType="${databaseOperation.operationType}"` });
		return;
	}

	//
	// Transform the APEX Banking Tap document into a SimplifiedApexBankingTap
	// and write it to the database, using a batch writer.

	try {
		await ridesWriter.write(databaseOperation.fullDocument);

		if (!databaseOperation.fullDocument.analyses) {
			// Logger.info({ message: `No analyses found for ride: ${databaseOperation.fullDocument._id}` });
			return;
		}

		await Promise.all([
			rideAnalysisAtLeastOneVehicleEventOnFirstStopWriter.write(databaseOperation.fullDocument.analyses.at_least_one_vehicle_event_on_first_stop),
			rideAnalysisAtLeastOneVehicleEventOnLastStopWriter.write(databaseOperation.fullDocument.analyses.at_least_one_vehicle_event_on_last_stop),
			rideAnalysisExpectedApexValidationIntervalWriter.write(databaseOperation.fullDocument.analyses.expected_apex_validation_interval),
			rideAnalysisExpectedDriverIdQtyWriter.write(databaseOperation.fullDocument.analyses.expected_driver_id_qty),
			rideAnalysisExpectedStartTimeWriter.write(databaseOperation.fullDocument.analyses.expected_start_time),
			rideAnalysisExpectedVehicleEventDelayWriter.write(databaseOperation.fullDocument.analyses.expected_vehicle_event_delay),
			rideAnalysisExpectedVehicleEventIntervalWriter.write(databaseOperation.fullDocument.analyses.expected_vehicle_event_interval),
			rideAnalysisExpectedVehicleEventQtyWriter.write(databaseOperation.fullDocument.analyses.expected_vehicle_event_qty),
			rideAnalysisExpectedVehicleIdQtyWriter.write(databaseOperation.fullDocument.analyses.expected_vehicle_id_qty),
			rideAnalysisMatchingApexLocationsWriter.write(databaseOperation.fullDocument.analyses.matching_apex_locations),
			rideAnalysisMatchingVehicleIdsWriter.write(databaseOperation.fullDocument.analyses.matching_vehicle_ids),
			rideAnalysisSimpleOneApexValidationWriter.write(databaseOperation.fullDocument.analyses.simple_one_apex_validation),
			rideAnalysisSimpleOneVehicleEventOrApexValidationWriter.write(databaseOperation.fullDocument.analyses.simple_one_vehicle_event_or_apex_validation),
			rideAnalysisSimpleThreeVehicleEventsWriter.write(databaseOperation.fullDocument.analyses.simple_three_vehicle_events),
			rideAnalysisTransactionSequentialityWriter.write(databaseOperation.fullDocument.analyses.transaction_sequentiality),
		]);

		//
	} catch (error) {
		const errorMessage = error instanceof ZodError
			? error.issues.map(issue => `${issue.path.join('.')} ${issue.message}`).join('; ')
			: error instanceof Error ? error.message : String(error);
		Logger.error({ message: `Error synchronizing ride or analyses: ${databaseOperation.fullDocument._id} - Reason: ${errorMessage}` });
	}
};
