/* * */

import PCGIDB from '@/services/PCGIDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { MongoDbWriter } from '@helperkits/writer';
import { vehicleEvents } from '@tmlmobilidade/services/interfaces';
import { CreateVehicleEventDto } from '@tmlmobilidade/services/types';
import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { DateTime, Interval } from 'luxon';

/* * */

export async function syncVehicleEvents() {
	try {
		//

		LOGGER.init();

		const globalTimer = new TIMETRACKER();

		//
		// Connect to databases and setup DB writers

		await PCGIDB.connect();

		const vehicleEventsCollection = await vehicleEvents.getCollection();
		const vehicleEventsDbWritter = new MongoDbWriter('vehicle_events', vehicleEventsCollection, { batch_size: 100000 });

		//
		// In order to sync both collections in a manageable way, due to the high volume of data,
		// it is necessary to divide the process into smaller blocks. Instead of syncing all documents at once,
		// divide the process by timestamps chunks and iterate over each one, getting all document IDs from both databases.
		// Like this we can more easily compare the IDs in memory and sync only the missing documents.
		// More recent data is more important than older data, so we start syncing the most recent data first.
		// It makes sense to divide chunks by day, but this should be adjusted according to the volume of data in each chunk.

		const thirtySecondsAgo = DateTime.now().minus({ seconds: 30 });
		const oldestDataNeeded = DateTime.fromFormat('20240101', 'yyyyMMdd').set({ hour: 4, minute: 0, second: 0 });

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

			const allPcgidbVehicleEventDocumentIds = await PCGIDB.VehicleEvents.distinct('_id', {
				millis: {
					$gte: timestampChunk.start.toMillis(),
					$lte: timestampChunk.end.toMillis(),
				},
			});

			const allSlaVehicleEventDocumentIds = await vehicleEventsCollection.distinct('_id', {
				insert_timestamp: {
					$gte: timestampChunk.start.toMillis(),
					$lte: timestampChunk.end.toMillis(),
				},
			});

			const uniqueSlaVehicleEventDocumentIds = new Set(allSlaVehicleEventDocumentIds.map(String));

			//
			// Check if all documents in PCGIDB are already synced

			const missingDocuments = allPcgidbVehicleEventDocumentIds.filter(documentId => !uniqueSlaVehicleEventDocumentIds.has(String(documentId)));

			//
			// If there are missing documents, sync them

			if (missingDocuments.length > 0) {
				//

				LOGGER.info(`Found ${missingDocuments.length} unsynced documents. Syncing...`);

				const missingDocumentsStream = PCGIDB.VehicleEvents
					.find({ _id: { $in: missingDocuments } })
					.stream();

				for await (const pcgiDocument of missingDocumentsStream) {
					const vehicleTimestamp = DateTime.fromSeconds(pcgiDocument.content.entity[0].vehicle.timestamp);
					const operationalDate = getOperationalDate(vehicleTimestamp);
					const newVehicleEventDocument: CreateVehicleEventDto = {
						_id: pcgiDocument._id,
						agency_id: pcgiDocument.content.entity[0].vehicle.agencyId,
						data: JSON.stringify(pcgiDocument),
						event_id: pcgiDocument.content.entity[0]._id,
						insert_timestamp: pcgiDocument.millis,
						line_id: pcgiDocument.content.entity[0].vehicle.trip?.lineId,
						odometer: pcgiDocument.content.entity[0].vehicle.position.odometer,
						operational_date: operationalDate,
						pattern_id: pcgiDocument.content.entity[0].vehicle.trip?.patternId,
						route_id: pcgiDocument.content.entity[0].vehicle.trip?.routeId,
						stop_id: pcgiDocument.content.entity[0].vehicle.stopId,
						trip_id: pcgiDocument.content.entity[0].vehicle.trip?.tripId,
						vehicle_id: pcgiDocument.content.entity[0].vehicle.vehicle._id,
						vehicle_timestamp: vehicleTimestamp.toSeconds(),
					};
					await vehicleEventsDbWritter.write(newVehicleEventDocument, { filter: { _id: newVehicleEventDocument._id }, upsert: true });
				}

				await vehicleEventsDbWritter.flush();

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
