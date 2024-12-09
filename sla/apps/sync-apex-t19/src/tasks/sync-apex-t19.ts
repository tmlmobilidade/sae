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

const CHUNK_FORMAT = 'yyyy-LL-dd\' \'HH\'h \'mm\'m \'ss\'s\'';

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

		for (const [chunkIndex, chunkData] of allTimestampChunks.entries()) {
			//

			const chunkTimer = new TIMETRACKER();

			LOGGER.divider(`[${chunkIndex + 1}/${allTimestampChunks.length}]`);
			LOGGER.info(`Processing chunk (${chunkData.end.toFormat(CHUNK_FORMAT)}) › (${chunkData.start.toFormat(CHUNK_FORMAT)})...`);

			//
			// Prepare the query for this timestamp chunk

			const pcgidbQuery = {
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
			// Get distinct IDs from each database in the current timestamp chunk

			const quickCountTimer = new TIMETRACKER();

			const allPcgidbApexT19DocumentCount = await PCGIDB.LocationEntity.countDocuments(pcgidbQuery);
			const allSlaApexT19DocumenCount = await apexT19Collection.countDocuments(slaQuery);
			if (allPcgidbApexT19DocumentCount === allSlaApexT19DocumenCount) {
				LOGGER.success(`MATCH - Found the same number of documents. (${allPcgidbApexT19DocumentCount} PCGIDB = ${allSlaApexT19DocumenCount} SLA) (${quickCountTimer.get()})`);
				continue;
			}

			LOGGER.info(`MISMATCH - Found different number of documents. (${allPcgidbApexT19DocumentCount} PCGIDB != ${allSlaApexT19DocumenCount} SLA) (${quickCountTimer.get()})`);

			//
			// Get distinct IDs from each database in the current timestamp chunk

			const distinctQueryTimer = new TIMETRACKER();

			const allPcgidbApexT19DocumentIds = await PCGIDB.LocationEntity.distinct('transaction.transactionId', pcgidbQuery);
			const uniquePcgidbApexT19DocumentIds = new Set(allPcgidbApexT19DocumentIds);

			const allSlaApexT19DocumenIds = await apexT19Collection.distinct('_id', slaQuery);
			const uniqueSlaApexT19DocumentIds = new Set(allSlaApexT19DocumenIds);

			//
			// Check if all documents in PCGIDB are already synced

			const missingDocuments = allPcgidbApexT19DocumentIds.filter((documentId: string) => !uniqueSlaApexT19DocumentIds.has(documentId));
			const extraDocuments = allSlaApexT19DocumenIds.filter((documentId: string) => !uniquePcgidbApexT19DocumentIds.has(documentId));

			if (missingDocuments.length === 0) {
				LOGGER.success(`Chunk complete. All document IDs matched. (${distinctQueryTimer.get()})`);
			}

			if (extraDocuments.length > 0) {
				await apexT19Collection.deleteMany({ _id: { $in: extraDocuments }, created_at: { $gte: chunkData.start.toJSDate(), $lte: chunkData.end.toJSDate() } });
				LOGGER.info(`Removed ${extraDocuments.length} extra document IDs in SLA APEX T19 (${distinctQueryTimer.get()})`);
			}

			//
			// If there are missing documents, sync them

			LOGGER.info(`Found ${missingDocuments.length} unmatched document IDs (${distinctQueryTimer.get()})`);

			const missingDocumentsStream = PCGIDB.LocationEntity
				.find({ 'transaction.transactionId': { $in: missingDocuments } })
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

			LOGGER.success(`Chunk complete. Synced ${missingDocuments.length} new documents. (${chunkTimer.get()})`);

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
