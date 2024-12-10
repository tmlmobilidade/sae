/* * */

import PCGIDB from '@/services/PCGIDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { MongoDbWriter } from '@helperkits/writer';
import { CHUNK_LOG_DATE_FORMAT } from '@tmlmobilidade/sae-sla-pckg-constants';
import { parseApexT11 } from '@tmlmobilidade/sae-sla-pckg-parse';
import { syncDocuments } from '@tmlmobilidade/sae-sla-pckg-sync';
import { apexT11, rides } from '@tmlmobilidade/services/interfaces';
import { OperationalDate } from '@tmlmobilidade/services/types';
import { DateTime, Interval } from 'luxon';

/* * */

export async function syncApexT11() {
	try {
		//

		LOGGER.init();

		const globalTimer = new TIMETRACKER();

		//
		// Connect to databases and setup DB writers

		await PCGIDB.connect();

		const apexT11Collection = await apexT11.getCollection();
		const apexT11DbWritter = new MongoDbWriter('apex_t11', apexT11Collection, { batch_size: 100000 });

		//
		// In order to sync both collections in a manageable way, due to the high volume of data,
		// it is necessary to divide the process into smaller blocks. Instead of syncing all documents at once,
		// divide the process by timestamps chunks and iterate over each one, getting all document IDs from both databases.
		// Like this we can more easily compare the IDs in memory and sync only the missing documents.
		// More recent data is more important than older data, so we start syncing the most recent data first.
		// It makes sense to divide chunks by day, but this should be adjusted according to the volume of data in each chunk.

		const thirtySecondsAgo = DateTime.now().minus({ seconds: 30 });
		const earliestDataNeeded = DateTime.fromFormat(process.env.SYNC_EARLIEST_DATE, 'yyyyMMdd').set({ hour: 4, minute: 0, second: 0 });

		const allTimestampChunks = Interval
			.fromDateTimes(earliestDataNeeded, thirtySecondsAgo)
			.splitBy({ hour: 3 })
			.sort((a, b) => b.start.toMillis() - a.start.toMillis());

		//
		// Iterate over each timestamp chunk and sync the documents.
		// Timestamp chunks are sorted in descending order, so that more recent data is processed first.
		// Timestamp chunks are in the format { start: day1, end: day2 }, so end is always greater than start.
		// This might be confusing as the array of chunks itself is sorted in descending order, but the chunks individually are not.

		for (const [chunkIndex, chunkData] of allTimestampChunks.entries()) {
			//

			const chunkTimer = new TIMETRACKER();

			LOGGER.spacer(1);
			LOGGER.divider(`[${chunkIndex + 1}/${allTimestampChunks.length}] - ${chunkData.end.toFormat(CHUNK_LOG_DATE_FORMAT)} › ${chunkData.start.toFormat(CHUNK_LOG_DATE_FORMAT)}`, 100);

			//
			// Setup the callback function that will be called on the DB Writer flush operation
			// to invalidate all the rides that are affected by the new vehicle events.

			const flushCallback = async (flushedData) => {
				try {
					const invalidationTimer = new TIMETRACKER();
					// Extract the unique trip_ids and unique operational_dates from the flushed data
					const uniqueTripIds: string[] = Array.from(new Set(flushedData.map(writeOp => writeOp.data.trip_id)));
					const uniqueOperationalDates: OperationalDate[] = Array.from(new Set(flushedData.map(writeOp => writeOp.data.operational_date)));
					// Invalidate all rides with new data
					const ridesCollection = await rides.getCollection();
					const invalidationResult = await ridesCollection.updateMany({ operational_date: { $in: uniqueOperationalDates }, trip_id: { $in: uniqueTripIds } }, { $set: { status: 'pending' } });
					LOGGER.info(`Flush: Marked ${invalidationResult.modifiedCount} Rides as 'pending' due to new apex_t11 data (${invalidationTimer.get()})`);
				}
				catch (error) {
					LOGGER.error('Error in flushCallback', error);
				}
			};

			//
			// Prepare the queries to compare documents from each database
			// in the current timestamp chunk.

			const pcgiQuery = {
				'transaction.transactionDate': {
					$gte: chunkData.start.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss'),
					$lte: chunkData.end.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss'),
				},
			};

			const slaQuery = {
				created_at: {
					$gte: chunkData.start.toJSDate(),
					$lte: chunkData.end.toJSDate(),
				},
			};

			//
			// Sync the documents

			await syncDocuments({

				dbWriter: apexT11DbWritter,

				docParser: parseApexT11,

				flushCallback: flushCallback,

				pcgiCollection: PCGIDB.ValidationEntity,

				pcgiIdKey: 'transaction.transactionId',

				pcgiQuery: pcgiQuery,

				slaCollection: apexT11Collection,

				slaIdKey: '_id',

				slaQuery: slaQuery,

			});

			//

			LOGGER.success(`Chunk sync complete (${chunkTimer.get()})`);

			//
		}

		//

		LOGGER.terminate(`Run took ${globalTimer.get()}.`);

		//
	}
	catch (err) {
		console.log('An error occurred. Halting execution.', err);
		console.log('Retrying in 10 seconds...');
		setTimeout(() => {
			process.exit(0); // End process
		}, 10000); // after 10 seconds
	}

	//
};
