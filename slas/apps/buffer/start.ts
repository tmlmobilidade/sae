/* * */

import PCGIDB from '@/services/PCGIDB.js';
import SLAMANAGERBUFFERDB from '@/services/SLAMANAGERBUFFERDB.js';
import SLAMANAGERDB from '@/services/SLAMANAGERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { MongoDbWriter } from '@helperkits/writer';
import { DateTime } from 'luxon';

/* * */

const BUFFER_MIN_DATE = '20240101';
const BUFFER_MAX_DATE = '20241231';
const BUFFER_DAYS_DELAY = 1;

/* * */

async function setOperationalDayStatus(operationalDay: string, documentType: string, status: boolean) {
	//
	const setOperationalDayTimer = new TIMETRACKER();
	// Update the operational day status in the database
	await SLAMANAGERBUFFERDB.OperationalDayStatus.updateOne({ operational_day: operationalDay, status: { $nin: ['locked'] } }, { $set: { [`${documentType}_synced`]: status, operational_day: operationalDay } }, { upsert: true });
	//
	if (status) {
		// Log sucess if status is true
		LOGGER.success(`Marked "${documentType}" as "${status}" on operational day "${operationalDay}" (${setOperationalDayTimer.get()})`);
	}
	else {
		// Log error and mark all trip analysis for the current operational day as pending if status is false
		await SLAMANAGERDB.TripAnalysis.updateMany({ operational_day: operationalDay }, { $set: { status: 'pending' } });
		LOGGER.error(`Marked "${documentType}" as "${status}" on operational day "${operationalDay}", as well as all TripAnalysis for this day (${setOperationalDayTimer.get()})`);
	}
	//
}

/* * */

async function fetchDocumentIdsSet(dbCollection, dbQuery, key: string): Promise<Set<string>> {
	// Initiate a new set to hold the unique document IDs
	const uniqueDocumentIds = new Set<string>();
	// Stream the documents from the collection
	const dbDocumentsStream = dbCollection.find(dbQuery).stream();
	// Iterate over the stream and add the IDs to the set
	for await (const dbDocument of dbDocumentsStream) {
		uniqueDocumentIds.add(String(dbDocument[key]));
	}
	// Return the set
	return uniqueDocumentIds;
	//
}

/* * */

async function syncDocuments(documentType: string, operationalDay: string, pcgiCollection, bufferCollection, pcgiQuery, bufferQuery, pcgiDocumentTransform, dbWriter: MongoDbWriter) {
	//

	LOGGER.spacer(1);
	LOGGER.title(`Syncing "${documentType}" documents for "${operationalDay}"...`);

	const syncDocumentsTimer = new TIMETRACKER();

	//
	// Initiate variables to hold the document IDs from PCGIDB and SLAMANAGERBUFFERDB
	// These variables are used across the sync process to compare and update the documents

	const pcgiDocumentIdsSet = new Set<string>();
	let bufferDocumentIdsSet = new Set<string>();

	//
	// Count the number of document in each database. If the counts match, skip the sync.
	// Even though this is not a foolproof method, it is a good first step to avoid unnecessary syncs.
	// If the match fails, proceed with the sync to ensure all documents are available in BUFFERDB.
	// Set the status of the operational day to true if the counts match, false if they do not,
	// as this ensures only days that are fully synced are used in trip analysis.

	try {
		//

		const pcgiCountTimer = new TIMETRACKER();
		const pcgiCountValue = await pcgiCollection.countDocuments(pcgiQuery);
		LOGGER.info(`Found ${pcgiCountValue} "${documentType}" documents in PCGIDB for "${operationalDay}" (${pcgiCountTimer.get()})`);

		const bufferCountTimer = new TIMETRACKER();
		const bufferCountValue = await bufferCollection.countDocuments(bufferQuery);
		LOGGER.info(`Found ${bufferCountValue} "${documentType}" documents in SLAMANAGERBUFFERDB for "${operationalDay}" (${bufferCountTimer.get()})`);

		if (pcgiCountValue === bufferCountValue) {
			await setOperationalDayStatus(operationalDay, documentType, true);
			LOGGER.success(`All "${documentType}" documents for "${operationalDay}" are already in sync (${syncDocumentsTimer.get()})`);
			return;
		}

		await setOperationalDayStatus(operationalDay, documentType, false);
		LOGGER.error(`Document count between databases did not match. Starting sync for "${documentType}" documents for "${operationalDay}"...`);

		//
	}
	catch (error) {
		await setOperationalDayStatus(operationalDay, documentType, false);
		throw new Error(error);
	}

	//
	// Actually sync the documents from PCGIDB to SLAMANAGERBUFFERDB
	// Fetch a set of document IDs from SLAMANAGERBUFFERDB and compare them with the IDs from PCGIDB
	// Add the documents from PCGIDB that are not present in SLAMANAGERBUFFERDB

	try {
		//
		// Fetch all document IDs from SLAMANAGERBUFFERDB

		const bufferDocumentsTimer = new TIMETRACKER();

		bufferDocumentIdsSet = await fetchDocumentIdsSet(bufferCollection, bufferQuery, 'pcgi_id');

		LOGGER.info(`Fetched ${bufferDocumentIdsSet.size} "${documentType}" document IDs in SLAMANAGERBUFFERDB for "${operationalDay}" (${bufferDocumentsTimer.get()})`);

		//
		// Fetch all documents from PCGIDB

		const pcgiDocumentsTimer = new TIMETRACKER();

		const pcgiDocumentsStream = pcgiCollection.find(pcgiQuery).stream();

		for await (const pcgiDocument of pcgiDocumentsStream) {
			pcgiDocumentIdsSet.add(String(pcgiDocument._id));
			if (bufferDocumentIdsSet.has(String(pcgiDocument._id))) {
				continue;
			}
			const formattedObject = pcgiDocumentTransform(pcgiDocument);
			await dbWriter.write(formattedObject, { filter: { pcgi_id: formattedObject.pcgi_id }, upsert: true });
		}

		await dbWriter.flush();

		LOGGER.success(`Added ${pcgiDocumentIdsSet.size} "${documentType}" documents from PCGIDB to SLAMANAGERBUFFERDB for operational_day "${operationalDay}" (${pcgiDocumentsTimer.get()})`);

		//
	}
	catch (error) {
		await setOperationalDayStatus(operationalDay, documentType, false);
		throw new Error(error);
	}

	//
	// Remove stale documents from SLAMANAGERBUFFERDB that are no longer present in PCGIDB
	// To do this, refetch the document IDs from SLAMANAGERBUFFERDB and compare with the IDs from PCGIDB
	// Create a set of the stale document IDs and delete them from SLAMANAGERBUFFERDB

	try {
		//
		// Fetch all document IDs from SLAMANAGERBUFFERDB

		const bufferDocumentsTimer = new TIMETRACKER();

		bufferDocumentIdsSet = await fetchDocumentIdsSet(bufferCollection, bufferQuery, 'pcgi_id');

		LOGGER.info(`Fetched ${bufferDocumentIdsSet.size} "${documentType}" document IDs in SLAMANAGERBUFFERDB for "${operationalDay}" (${bufferDocumentsTimer.get()})`);

		//
		// Run a comparison between the document IDs from PCGIDB and SLAMANAGERBUFFERDB

		for (const bufferDocumentId of bufferDocumentIdsSet) {
			if (pcgiDocumentIdsSet.has(bufferDocumentId)) {
				bufferDocumentIdsSet.delete(bufferDocumentId);
			}
		}

		//
		// Delete the stale documents from SLAMANAGERBUFFERDB

		await bufferCollection.deleteMany({ pcgi_id: { $in: Array.from(bufferDocumentIdsSet) } });

		LOGGER.success(`Deleted ${bufferDocumentIdsSet.size} "${documentType}" documents from SLAMANAGERBUFFERDB that are no longer present in PCGIDB for operational_day "${operationalDay}" (${bufferDocumentsTimer.get()})`);

		//
	}
	catch (error) {
		await setOperationalDayStatus(operationalDay, documentType, false);
		throw new Error(error);
	}

	//
	// After sync is complete, without any errors, set the operational day status to true for this document type

	await setOperationalDayStatus(operationalDay, documentType, true);

	LOGGER.success(`Synced all "${documentType}" documents between PCGIDB and SLAMANAGERBUFFERDB for operational_day "${operationalDay}" (${syncDocumentsTimer.get()})`);

	//
}

/* * */

export default async () => {
	try {
		//

		LOGGER.init();

		const globalTimer = new TIMETRACKER();

		// 1.
		// Connect to databases

		LOGGER.info('Connecting to databases...');

		await SLAMANAGERDB.connect();
		await SLAMANAGERBUFFERDB.connect();
		await PCGIDB.connect();

		const bufferDataDbWritter = new MongoDbWriter('BufferData', SLAMANAGERBUFFERDB.BufferData, { batch_size: 100000 });

		LOGGER.divider();

		// 2.
		// Get all existing operational days, even ones that are already buffered.
		// Sort them in descending order to process the most recent days first.

		const allOperationalDays = await SLAMANAGERDB.TripAnalysis.distinct('operational_day');

		allOperationalDays.sort((a: string, b: string) => b.localeCompare(a));

		LOGGER.info(`Found ${allOperationalDays.length} operational days. Checking each one...`);

		// 3.
		// Iterate on each day

		for (const [operationalDayIndex, operationalDay] of allOperationalDays.entries()) {
			//

			LOGGER.divider();

			const operationalDayTimer = new TIMETRACKER();

			// 3.1.
			// Skip this day if it is outside the allowed buffer range

			if (operationalDay < BUFFER_MIN_DATE || operationalDay > BUFFER_MAX_DATE) {
				LOGGER.success(`[${operationalDayIndex + 1}/${allOperationalDays.length}] Skipping operational_day "${operationalDay}" as it is outside the allowed buffer range (${BUFFER_MIN_DATE} - ${BUFFER_MAX_DATE}).`);
				continue;
			}

			// 3.2.
			// Skip this day if it is after the current date minus 2 days

			const todayMinusTwoDays = DateTime.now().minus({ days: BUFFER_DAYS_DELAY }).toFormat('yyyyMMdd');

			if (operationalDay > todayMinusTwoDays) {
				LOGGER.error(`[${operationalDayIndex + 1}/${allOperationalDays.length}] Skipping operational_day "${operationalDay}" as it is after the current date (${todayMinusTwoDays}).`);
				continue;
			}

			//

			LOGGER.info(`[${operationalDayIndex + 1}/${allOperationalDays.length}] Checking sync status for operational_day "${operationalDay}"...`);

			// 3.3.
			// Convert operational day into required formats

			const operationalDayStart = DateTime.fromFormat(operationalDay, 'yyyyMMdd').set({ hour: 4, minute: 0, second: 0 });
			const operationalDayEnd = DateTime.fromFormat(operationalDay, 'yyyyMMdd').plus({ day: 1 }).set({ hour: 3, minute: 59, second: 59 });

			const operationalDayStartMillis = operationalDayStart.toMillis();
			const operationalDayEndMillis = operationalDayEnd.toMillis();

			const operationalDayStartString = operationalDayStart.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');
			const operationalDayEndString = operationalDayEnd.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');

			// 3.4.
			// Syncronize Vehicle Events

			try {
				//

				const pcgiVehicleEventsQuery = {
					'content.entity.vehicle.trip.tripId': { $exists: true },
					'millis': { $gte: operationalDayStartMillis, $lte: operationalDayEndMillis },
				};

				const bufferVehicleEventsQuery = {
					operational_day: operationalDay,
					type: 'vehicle_event',
				};

				const pcgiVehicleEventsDocumentTransform = (pcgiDocument) => {
					return {
						agency_id: pcgiDocument.content.entity[0].vehicle.agencyId,
						data: JSON.stringify(pcgiDocument),
						line_id: pcgiDocument.content.entity[0].vehicle.trip.lineId,
						odometer: pcgiDocument.content.entity[0].vehicle.position.odometer,
						operational_day: operationalDay,
						original_id: pcgiDocument.content.entity[0]._id,
						pattern_id: pcgiDocument.content.entity[0].vehicle.trip.patternId,
						pcgi_id: String(pcgiDocument._id),
						route_id: pcgiDocument.content.entity[0].vehicle.trip.routeId,
						stop_id: pcgiDocument.content.entity[0].vehicle.stopId,
						timestamp: DateTime.fromSeconds(pcgiDocument.content.entity[0].vehicle.timestamp).toMillis(),
						trip_id: pcgiDocument.content.entity[0].vehicle.trip.tripId,
						type: 'vehicle_event',
						vehicle_id: pcgiDocument.content.entity[0].vehicle.vehicle._id,
					};
				};

				await syncDocuments('vehicle_event', operationalDay, PCGIDB.VehicleEvents, SLAMANAGERBUFFERDB.BufferData, pcgiVehicleEventsQuery, bufferVehicleEventsQuery, pcgiVehicleEventsDocumentTransform, bufferDataDbWritter);

				//
			}
			catch (error) {
				LOGGER.error(`Error syncing Vehicle Events for "${operationalDay}".`, error);
			}

			await bufferDataDbWritter.flush();

			// 3.5.
			// Syncronize Validation Transactions

			try {
				//

				const pcgiValidationTransactionsQuery = {
					'transaction.transactionDate': { $gte: operationalDayStartString, $lte: operationalDayEndString },
					'transaction.validationStatus': { $in: [0, 8] },
				};

				const bufferValidationTransactionsQuery = {
					operational_day: operationalDay,
					type: 'validation_transaction',
				};

				const pcgiValidationTransactionsDocumentTransform = (pcgiDocument) => {
					return {
						agency_id: pcgiDocument.transaction.operatorLongID,
						data: JSON.stringify(pcgiDocument),
						device_id: pcgiDocument.transaction.deviceID,
						line_id: pcgiDocument.transaction.lineLongID,
						operational_day: operationalDay,
						original_id: pcgiDocument.transaction.transactionId,
						pattern_id: pcgiDocument.transaction.patternLongID,
						pcgi_id: String(pcgiDocument._id),
						route_id: pcgiDocument.transaction.routeLongID,
						stop_id: pcgiDocument.transaction.stopLongID,
						timestamp: DateTime.fromFormat(pcgiDocument.transaction.transactionDate, 'yyyy-LL-dd\'T\'HH:mm:ss').toMillis(),
						trip_id: pcgiDocument.transaction.journeyID,
						type: 'validation_transaction',
						vehicle_id: pcgiDocument.transaction.vehicleID,
					};
				};

				await syncDocuments('validation_transaction', operationalDay, PCGIDB.ValidationEntity, SLAMANAGERBUFFERDB.BufferData, pcgiValidationTransactionsQuery, bufferValidationTransactionsQuery, pcgiValidationTransactionsDocumentTransform, bufferDataDbWritter);

				//
			}
			catch (error) {
				LOGGER.error(`Error syncing Validation Transactions for "${operationalDay}".`, error);
			}

			await bufferDataDbWritter.flush();

			// 3.6.
			// Syncronize Location Transactions

			try {
				//

				const pcgiLocationTransactionsQuery = {
					'transaction.transactionDate': { $gte: operationalDayStartString, $lte: operationalDayEndString },
				};

				const bufferLocationTransactionsQuery = {
					operational_day: operationalDay,
					type: 'location_transaction',
				};

				const pcgiLocationTransactionsDocumentTransform = (pcgiDocument) => {
					return {
						agency_id: pcgiDocument.transaction.operatorLongID,
						data: JSON.stringify(pcgiDocument),
						device_id: pcgiDocument.transaction.deviceID,
						line_id: pcgiDocument.transaction.lineLongID,
						operational_day: operationalDay,
						original_id: pcgiDocument.transaction.transactionId,
						pattern_id: pcgiDocument.transaction.patternLongID,
						pcgi_id: String(pcgiDocument._id),
						route_id: pcgiDocument.transaction.routeLongID,
						stop_id: pcgiDocument.transaction.stopLongID,
						timestamp: DateTime.fromFormat(pcgiDocument.transaction.transactionDate, 'yyyy-LL-dd\'T\'HH:mm:ss').toMillis(),
						trip_id: pcgiDocument.transaction.journeyID,
						type: 'location_transaction',
						vehicle_id: pcgiDocument.transaction.vehicleID,
					};
				};

				await syncDocuments('location_transaction', operationalDay, PCGIDB.LocationEntity, SLAMANAGERBUFFERDB.BufferData, pcgiLocationTransactionsQuery, bufferLocationTransactionsQuery, pcgiLocationTransactionsDocumentTransform, bufferDataDbWritter);

				//
			}
			catch (error) {
				LOGGER.error(`Error syncing Location Transactions for "${operationalDay}".`, error);
			}

			await bufferDataDbWritter.flush();

			//

			LOGGER.spacer(1);
			LOGGER.success(`[${operationalDayIndex + 1}/${allOperationalDays.length}] Buffering complete for operational_day "${operationalDay}" (${operationalDayTimer.get()})`);
			LOGGER.spacer(1);

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
