/* * */

import { rideAnalysisAtLeastOneVehicleEventOnFirstStopWriter, rideAnalysisAtLeastOneVehicleEventOnLastStopWriter, rideAnalysisExpectedApexValidationIntervalWriter, rideAnalysisExpectedDriverIdQtyWriter, rideAnalysisExpectedStartTimeWriter, rideAnalysisExpectedVehicleEventDelayWriter, rideAnalysisExpectedVehicleEventIntervalWriter, rideAnalysisExpectedVehicleEventQtyWriter, rideAnalysisExpectedVehicleIdQtyWriter, rideAnalysisMatchingApexLocationsWriter, rideAnalysisMatchingVehicleIdsWriter, rideAnalysisSimpleOneApexValidationWriter, rideAnalysisSimpleOneVehicleEventOrApexValidationWriter, rideAnalysisSimpleThreeVehicleEventsWriter, rideAnalysisTransactionSequentialityWriter, ridesWriter } from '@/utils/writers.js';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type RideWithAnalyses } from '@tmlmobilidade/go-types-operation';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { performInChunks, type PerformInTimeChunksItem, replicate } from '@tmlmobilidade/go-utils-exec';
import { Logger } from '@tmlmobilidade/logger';
import { type Filter } from 'mongodb';
import { ZodError } from 'zod';

/**
 * Syncs Rides from the database
 * to the ClickHouse database for a given time chunk.
 * @param timeChunk The time chunk to sync the data for.
 */
export async function syncRides(timeChunk: PerformInTimeChunksItem) {
	//

	const chunkStartDate = Dates
		.fromUnixMilliseconds(timeChunk.start)
		.setZone('Europe/Lisbon', 'offset_only');

	const chunkEndDate = Dates
		.fromUnixMilliseconds(timeChunk.end)
		.setZone('Europe/Lisbon', 'offset_only');

	Logger.spacer(1);
	Logger.divider(`[${timeChunk.total - timeChunk.index}/${timeChunk.total}] - ${chunkEndDate.iso}[${timeChunk.end}] › ${chunkStartDate.iso}[${timeChunk.start}]`, 150);

	//
	// Prepare the GoDB query to retrieve documents
	// for the current timestamp chunk.

	const godDQuery: Filter<RideWithAnalyses> = {
		updated_at: {
			$gte: timeChunk.start,
			$lt: timeChunk.end,
		},
	};

	const ridesCollection = await goDb.operation.rides.getCollection();

	//
	// Implement the replication process using the generic replicate function from the utils package.
	// This function will handle the logic of counting, comparing, syncing and deleting documents
	// between the source and destination databases based on the provided functions.

	await replicate<RideWithAnalyses>({

		countDestinationDbFn: async () => {
			return await labDb.operation.rides.count(
				'*',
				'updated_at >= $1 AND updated_at < $2',
				{ 1: timeChunk.start, 2: timeChunk.end },
			);
		},

		countSourceDbFn: async () => {
			const result = await goDb.operation.rides.count(godDQuery);
			return result;
		},

		deleteDestinationDbFn: async (ids: string[]) => {
			await performInChunks(ids, async (chunk) => {
				await labDb.operation.rides.delete(
					'_id IN $1',
					{ 1: chunk },
				);
			}, 1_000);
		},

		distinctDestinationDbFn: async () => {
			const result = await labDb.operation.rides.distinct(
				'_id',
				'created_at >= $1 AND created_at < $2',
				{ 1: timeChunk.start, 2: timeChunk.end },
			);
			return result.map(id => String(id).toUpperCase());
		},

		distinctSourceDbFn: async () => {
			const result = await goDb.operation.rides.distinct('_id', godDQuery);
			return result.map(String);
		},

		missingDocumentsSourceDbAsyncIterator: (missingDocumentIds) => {
			return ridesCollection
				.find({ _id: { $in: missingDocumentIds } })
				.stream();
		},

		writeSourceDocumentToDestinationDbFn: async (sourceDbDocument) => {
			try {
				await ridesWriter.write(sourceDbDocument);

				await Promise.all([
					rideAnalysisAtLeastOneVehicleEventOnFirstStopWriter.write(sourceDbDocument.analyses.at_least_one_vehicle_event_on_first_stop),
					rideAnalysisAtLeastOneVehicleEventOnLastStopWriter.write(sourceDbDocument.analyses.at_least_one_vehicle_event_on_last_stop),
					rideAnalysisExpectedApexValidationIntervalWriter.write(sourceDbDocument.analyses.expected_apex_validation_interval),
					rideAnalysisExpectedDriverIdQtyWriter.write(sourceDbDocument.analyses.expected_driver_id_qty),
					rideAnalysisExpectedStartTimeWriter.write(sourceDbDocument.analyses.expected_start_time),
					rideAnalysisExpectedVehicleEventDelayWriter.write(sourceDbDocument.analyses.expected_vehicle_event_delay),
					rideAnalysisExpectedVehicleEventIntervalWriter.write(sourceDbDocument.analyses.expected_vehicle_event_interval),
					rideAnalysisExpectedVehicleEventQtyWriter.write(sourceDbDocument.analyses.expected_vehicle_event_qty),
					rideAnalysisExpectedVehicleIdQtyWriter.write(sourceDbDocument.analyses.expected_vehicle_id_qty),
					rideAnalysisMatchingApexLocationsWriter.write(sourceDbDocument.analyses.matching_apex_locations),
					rideAnalysisMatchingVehicleIdsWriter.write(sourceDbDocument.analyses.matching_vehicle_ids),
					rideAnalysisSimpleOneApexValidationWriter.write(sourceDbDocument.analyses.simple_one_apex_validation),
					rideAnalysisSimpleOneVehicleEventOrApexValidationWriter.write(sourceDbDocument.analyses.simple_one_vehicle_event_or_apex_validation),
					rideAnalysisSimpleThreeVehicleEventsWriter.write(sourceDbDocument.analyses.simple_three_vehicle_events),
					rideAnalysisTransactionSequentialityWriter.write(sourceDbDocument.analyses.transaction_sequentiality),
				]);
			} catch (error) {
				const errorMessage = error instanceof ZodError
					? error.issues.map(issue => `${issue.path.join('.')} ${issue.message}`).join('; ')
					: error instanceof Error ? error.message : String(error);
				Logger.error({ message: `Error synchronizing ride or analyses: ${sourceDbDocument._id} - Reason: ${errorMessage}` });
			}
		},

	});

	//
}
