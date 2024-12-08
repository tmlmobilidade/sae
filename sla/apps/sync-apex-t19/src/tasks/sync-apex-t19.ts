/* * */

import PCGIDB from '@/services/PCGIDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { MongoDbWriter } from '@helperkits/writer';
import { apexT19, rides } from '@tmlmobilidade/services/interfaces';
import { ApexT19, OperationalDate } from '@tmlmobilidade/services/types';
import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { DateTime, Interval } from 'luxon';

/* * */

export async function syncApexT19() {
	try {
		//

		LOGGER.init();

		const globalTimer = new TIMETRACKER();

		//
		// Connect to databases and setup DB writers

		await PCGIDB.connect();

		const apexT19Collection = await apexT19.getCollection();
		const apexT19DbWritter = new MongoDbWriter('apex_t19', apexT19Collection, { batch_size: 100000 });

		//
		// In order to sync both collections in a manageable way, due to the high volume of data,
		// it is necessary to divide the process into smaller blocks. Instead of syncing all documents at once,
		// divide the process by timestamps chunks and iterate over each one, getting all document IDs from both databases.
		// Like this we can more easily compare the IDs in memory and sync only the missing documents.
		// More recent data is more important than older data, so we start syncing the most recent data first.
		// It makes sense to divide chunks by day, but this should be adjusted according to the volume of data in each chunk.

		const thirtySecondsAgo = DateTime.now().minus({ seconds: 30 });
		const oldestDataNeeded = DateTime.fromFormat('20241101', 'yyyyMMdd').set({ hour: 4, minute: 0, second: 0 });

		const allTimestampChunks = Interval
			.fromDateTimes(oldestDataNeeded, thirtySecondsAgo)
			.splitBy({ hour: 3 })
			.sort((a, b) => b.start.toMillis() - a.start.toMillis());

		//
		// Iterate over each timestamp chunk and sync the documents.
		// Timestamp chunks are sorted in descending order, so the most recent data is processed first.
		// Timestamp chunks are in the format { start: day1, end: day2 }, so end is always greater than start.
		// This might be confusing as the array of chunks itself is sorted in descending order, but the chunks individually are not.

		for (const timestampChunk of allTimestampChunks) {
			//

			LOGGER.divider();
			LOGGER.info(`Processing timestamp chunk from ${timestampChunk.start.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss')} to ${timestampChunk.end.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss')}...`);

			//
			// Get distinct IDs from each database in the current timestamp chunk

			const allPcgidbApexT19DocumentIds = await PCGIDB.ValidationEntity.distinct('_id', {
				'transaction.transactionDate': {
					$gte: timestampChunk.start.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss'),
					$lte: timestampChunk.end.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss'),
				},
			});

			const allSlaApexT19DocumentIds = await apexT19Collection.distinct('_id', {
				received_at: {
					$gte: timestampChunk.start.toJSDate(),
					$lte: timestampChunk.end.toJSDate(),
				},
			});

			const uniqueSlaApexT19DocumentIds = new Set(allSlaApexT19DocumentIds.map(String));

			//
			// Check if all documents in PCGIDB are already synced

			const missingDocuments = allPcgidbApexT19DocumentIds.filter(documentId => !uniqueSlaApexT19DocumentIds.has(String(documentId)));

			//
			// If there are missing documents, sync them

			if (missingDocuments.length > 0) {
				//

				LOGGER.info(`Found ${missingDocuments.length} unsynced documents. Syncing...`);

				const missingDocumentsStream = PCGIDB.ValidationEntity
					.find({ _id: { $in: missingDocuments } })
					.stream();

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
						LOGGER.info(`SYNC FULL [apex_t19]: Marked ${invalidationResult.modifiedCount} Rides as 'pending' due to new apex_t19 data (${invalidationTimer.get()})`);
						LOGGER.divider();
					}
					catch (error) {
						LOGGER.error('Error in flushCallback', error);
					}
				};

				for await (const pcgiDocument of missingDocumentsStream) {
					const transactionDate = DateTime.fromISO(pcgiDocument.transaction.transactionDate);
					const operationalDate = getOperationalDate(transactionDate);
					const newApexT19Document: ApexT19 = {
						_id: pcgiDocument.transaction.transactionId,
						_raw: JSON.stringify(pcgiDocument),
						agency_id: pcgiDocument.transaction.operatorLongID,
						apex_version: pcgiDocument.transaction.apexVersion,
						created_at: transactionDate.toJSDate(),
						device_id: pcgiDocument.transaction.deviceID,
						line_id: pcgiDocument.transaction.lineLongID,
						mac_ase_counter_value: pcgiDocument.transaction.macDataFields.aseCounterValue,
						mac_sam_serial_number: pcgiDocument.transaction.macDataFields.samSerialNumber,
						operational_date: operationalDate,
						pattern_id: pcgiDocument.transaction.patternLongID,
						received_at: DateTime.fromISO(pcgiDocument.createdAt).toJSDate(),
						stop_id: pcgiDocument.transaction.stopLongID,
						trip_id: pcgiDocument.transaction.journeyID,
						updated_at: DateTime.fromISO(pcgiDocument.createdAt).toJSDate(),
						vehicle_id: pcgiDocument.transaction.vehicleID,
					};
					await apexT19DbWritter.write(newApexT19Document, { filter: { _id: newApexT19Document._id }, upsert: true }, () => null, flushCallback);
				}

				await apexT19DbWritter.flush(flushCallback);

				LOGGER.success(`Synced ${missingDocuments.length} documents for timestamp chunk from ${timestampChunk.start.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss')} to ${timestampChunk.end.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss')}.`);
				continue;

				//
			}

			LOGGER.success(`All documents for timestamp chunk from ${timestampChunk.start.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss')} to ${timestampChunk.end.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss')} are already in sync.`);

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
