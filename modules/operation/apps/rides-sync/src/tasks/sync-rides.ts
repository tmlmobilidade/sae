/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type Ride, RideHash } from '@tmlmobilidade/go-types-operation';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { BatchWriter, performInChunks, type PerformInTimeChunksItem, replicate } from '@tmlmobilidade/go-utils-exec';
import { Logger } from '@tmlmobilidade/logger';
import { type Filter } from 'mongodb';

/* * */

export const ridesWriter = new BatchWriter<Ride>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rides.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rides.getTableName(),
});

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

	const godDQuery: Filter<Ride> = {
		start_time_scheduled: {
			$gte: timeChunk.start,
			$lt: timeChunk.end,
		},
	};

	const ridesCollection = await goDb.operation.rides.getCollection();

	//
	// Implement the replication process using the generic replicate function from the utils package.
	// This function will handle the logic of counting, comparing, syncing and deleting documents
	// between the source and destination databases based on the provided functions.

	await replicate<Ride>({

		countDestinationDbFn: async () => {
			const result = await labDb.operation.rides.count(
				'DISTINCT hash',
				'start_time_scheduled >= $1 AND start_time_scheduled < $2',
				{ 1: timeChunk.start, 2: timeChunk.end },
			);
			return result;
		},

		countSourceDbFn: async () => {
			const result = await goDb.operation.rides.distinct('hash', godDQuery);
			return result.length;
		},

		deleteDestinationDbFn: async (ids: string[]) => {
			await performInChunks(ids, async (chunk) => {
				await labDb.operation.rides.delete(
					'hash IN $1',
					{ 1: chunk },
				);
			}, 1_000);
		},

		distinctDestinationDbFn: async () => {
			const result = await labDb.operation.rides.distinct(
				'hash',
				'start_time_scheduled >= $1 AND start_time_scheduled < $2',
				{ 1: timeChunk.start, 2: timeChunk.end },
			);
			return result;
		},

		distinctSourceDbFn: async () => {
			const result = await goDb.operation.rides.distinct('hash', godDQuery);
			return result;
		},

		missingDocumentsSourceDbAsyncIterator: (missingDocumentIds: RideHash[]) => {
			return ridesCollection
				.find({ hash: { $in: missingDocumentIds } })
				.stream();
		},

		writeSourceDocumentToDestinationDbFn: async (sourceDbDocument) => {
			await ridesWriter.write(sourceDbDocument);
		},

	});

	//
	// Flush the writers

	await ridesWriter.flush();

	//
}
