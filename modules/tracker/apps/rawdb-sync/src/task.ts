/* * */

import { type Collection, type Filter } from '@tmlmobilidade/go-clients-mongo';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { setRidesAsWaiting } from '@tmlmobilidade/go-tracker-pckg-callback';
import { PARSER_MAP } from '@tmlmobilidade/go-tracker-pckg-parsers';
import { type SimplifiedVehicleEvent } from '@tmlmobilidade/go-types-vehicle-events';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { BatchWriter, performInChunks, type PerformInTimeChunksItem, replicate } from '@tmlmobilidade/go-utils-exec';
import { Logger } from '@tmlmobilidade/logger';
import { ZodError } from 'zod';

import { type SyncConfig, type VehicleEventsCollectionDocument } from './types.js';

/* * */

const writer = new BatchWriter<SimplifiedVehicleEvent>({
	batch_size: 10_000,
	insertFn: async (data) => {
		await labDb.operation.simplifiedVehicleEvents.insert('JSONEachRow', data);
	},
	title: await labDb.operation.simplifiedVehicleEvents.getTableName(),
});

/**
 * Syncs Vehicle Events from the RawDB database
 * to the ClickHouse database for a given time chunk.
 * @param timeChunk The time chunk to sync the data for.
 * @param agencyId The agency ID to sync the data for,
 * limited to the agencies configured to have `RawVehicleEvent` collections.
 */
export async function syncVehicleEvents(timeChunk: PerformInTimeChunksItem, configItem: SyncConfig) {
	//

	const chunkStartDate = Dates
		.fromUnixMilliseconds(timeChunk.start)
		.setZone('Europe/Lisbon', 'offset_only');

	const chunkEndDate = Dates
		.fromUnixMilliseconds(timeChunk.end)
		.setZone('Europe/Lisbon', 'offset_only');

	Logger.spacer(1);
	Logger.divider(`[${timeChunk.total - timeChunk.index}/${timeChunk.total}] ${configItem.agency_id} - ${chunkEndDate.iso}[${timeChunk.end}] › ${chunkStartDate.iso}[${timeChunk.start}]`, 150);

	//
	// Prepare the PCGIDB query to retrieve documents
	// for the current timestamp chunk.

	const rawdbQuery: Filter<VehicleEventsCollectionDocument<SyncConfig['collection']>> = {
		agency_id: configItem.agency_id,
		created_at: {
			$gte: timeChunk.start,
			$lt: timeChunk.end,
		},
	};

	//
	// Implement the replication process using the generic replicate function from the utils package.
	// This function will handle the logic of counting, comparing, syncing and deleting documents
	// between the source and destination databases based on the provided functions.

	// `getCollection()` on a SyncConfig union yields `Collection<A> | Collection<B> | …`,
	// which rejects `Filter<A | B>`. Collapse to `Collection<A | B>` so the filter type-checks.
	const rawdbCollection = await configItem.collection.getCollection() as Collection<VehicleEventsCollectionDocument<SyncConfig['collection']>>;

	await replicate<VehicleEventsCollectionDocument<SyncConfig['collection']>>({

		countDestinationDbFn: async () => {
			return await labDb.operation.simplifiedVehicleEvents.count(
				'*',
				'created_at >= $1 AND created_at < $2 AND agency_id = $3',
				{ 1: timeChunk.start, 2: timeChunk.end, 3: configItem.agency_id },
			);
		},

		countSourceDbFn: async () => {
			const result = await rawdbCollection.countDocuments(rawdbQuery);
			return result;
		},

		deleteDestinationDbFn: async (ids: string[]) => {
			await performInChunks(ids, async (chunk) => {
				await labDb.operation.simplifiedVehicleEvents.delete(
					'_id IN $1',
					{ 1: chunk },
				);
			}, 1_000);
		},

		distinctDestinationDbFn: async () => {
			return await labDb.operation.simplifiedVehicleEvents.distinct(
				'_id',
				'created_at >= $1 AND created_at < $2 AND agency_id = $3',
				{ 1: timeChunk.start, 2: timeChunk.end, 3: configItem.agency_id },
			);
		},

		distinctSourceDbFn: async () => {
			return await rawdbCollection.distinct('_id', rawdbQuery);
		},

		missingDocumentsSourceDbAsyncIterator: (missingDocumentIds) => {
			return rawdbCollection
				.find({ _id: { $in: missingDocumentIds } })
				.stream();
		},

		onCompleteCallbackFn: async () => {
			await writer.flush(setRidesAsWaiting);
		},

		writeSourceDocumentToDestinationDbFn: async (sourceDbDocument) => {
			try {
				// Get the parser for the vehicle event version
				const parser = PARSER_MAP[sourceDbDocument.version];
				if (!parser) throw new Error(`No parser found for version ${sourceDbDocument.version}. Skipping document with _id "${sourceDbDocument._id}"...`);
				// Parse the vehicle event into a simplified vehicle event
				const newSimplifiedVehicleEventDocument = await parser(sourceDbDocument);
				if (!newSimplifiedVehicleEventDocument) throw new Error(`Failed to parse document with _id "${sourceDbDocument._id}". Skipping...`);
				// Write the simplified vehicle event document to the destination database
				await writer.write(newSimplifiedVehicleEventDocument, { flushCallback: setRidesAsWaiting });
			} catch (error) {
				const errorMessage = error instanceof ZodError
					? error.issues.map(issue => `${issue.path.join('.')} ${issue.message}`).join('; ')
					: error instanceof Error ? error.message : String(error);
				Logger.info({ message: `=> Error transforming RawVehicleEvent document: [${sourceDbDocument.agency_id}] ${sourceDbDocument._id} Reason: ${errorMessage}` });
			}
		},

	});

	//
}
