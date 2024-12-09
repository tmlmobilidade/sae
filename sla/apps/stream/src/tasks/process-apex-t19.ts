/* * */

import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { MongoDbWriter } from '@helperkits/writer';
import { apexT19, rides } from '@tmlmobilidade/services/interfaces';
import { emailProvider } from '@tmlmobilidade/services/providers';
import { ApexT19, OperationalDate } from '@tmlmobilidade/services/types';
import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { DateTime } from 'luxon';

/* * */

const apexT19DbWritter = new MongoDbWriter('apex_t19', await apexT19.getCollection(), { batch_size: 250 });

/* * */

export async function processApexT19(databaseOperation) {
	//

	//
	// Validate that the operation is an insert or update. Otherwise, send an email to the emergency contact.
	// Only insert operations are expected to occur in this PCGIDB collection.

	if (databaseOperation.operationType !== 'insert') {
		LOGGER.error('MAJOR ERROR: processApexT19 called with operationType different than "insert".');
		await emailProvider.send({
			subject: 'SLA ERROR',
			text: `
				<h4>processApexT19 called with operationType different than "insert".</h4>
				<pre>${JSON.stringify(databaseOperation)}</pre>
			`,
			to: process.env.EMERGENCY_CONTACT,
		});
		return;
	}

	//
	// Extract the PCGI document from the database operation
	// and transform the vehicle timestamp into an operational date.

	const pcgiDocument = databaseOperation.fullDocument;
	const transactionDate = DateTime.fromISO(pcgiDocument.transaction.transactionDate);
	const operationalDate = getOperationalDate(transactionDate);

	//
	// Create a new transaction document and write it to the ApexT19 collection

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
			LOGGER.info(`SYNC LATEST [apex_t19]: Marked ${invalidationResult.modifiedCount} Rides as 'pending' due to new apex_t19 data (${invalidationTimer.get()})`);
			LOGGER.divider();
		}
		catch (error) {
			LOGGER.error('Error in flushCallback', error);
		}
	};

	//
	// Write the new vehicle event document to the ApexT19s collection

	await apexT19DbWritter.write(newApexT19Document, { filter: { _id: newApexT19Document._id }, upsert: true }, () => null, flushCallback);

	//
};