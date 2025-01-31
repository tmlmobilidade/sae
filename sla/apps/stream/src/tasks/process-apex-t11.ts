/* * */

import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { MongoDbWriter } from '@helperkits/writer';
import { apexT11, rides } from '@tmlmobilidade/core/interfaces';
import { emailProvider } from '@tmlmobilidade/core/providers';
import { OperationalDate } from '@tmlmobilidade/core/types';
import { parseApexT11 } from '@tmlmobilidade/sae-sla-pckg-parse';

/* * */

const apexT11DbWritter = new MongoDbWriter('apex_t11', await apexT11.getCollection(), { batch_size: 250 });

/* * */

export async function processApexT11(databaseOperation) {
	//

	//
	// Validate that the operation is an insert or update. Otherwise, send an email to the emergency contact.
	// Only insert operations are expected to occur in this PCGIDB collection.

	if (databaseOperation.operationType !== 'insert') {
		LOGGER.error('MAJOR ERROR: processApexT11 called with operationType different than "insert".');
		await emailProvider.send({
			subject: 'SLA ERROR',
			text: `
				<h4>processApexT11 called with operationType different than "insert".</h4>
				<pre>${JSON.stringify(databaseOperation)}</pre>
			`,
			to: process.env.EMERGENCY_CONTACT,
		});
		return;
	}

	//
	// Extract the PCGI document from the database operation
	// and transform the vehicle timestamp into an operational date.

	const newApexT11Document = parseApexT11(databaseOperation.fullDocument);

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
			LOGGER.info(`SYNC LATEST [apex_t11]: Marked ${invalidationResult.modifiedCount} Rides as 'pending' due to new apex_t11 data (${invalidationTimer.get()})`);
			LOGGER.divider();
		}
		catch (error) {
			LOGGER.error('Error in flushCallback', error);
		}
	};

	//
	// Write the new vehicle event document to the ApexT11s collection

	await apexT11DbWritter.write(newApexT11Document, { filter: { _id: newApexT11Document._id }, upsert: true }, () => null, flushCallback);

	//
	// Publish the heartbeats for each agency

	if (newApexT11Document.agency_id === '41') fetch('https://uptime.betterstack.com/api/v1/heartbeat/YwYCawo9Jw1CrrqYDfJxTBeU');
	if (newApexT11Document.agency_id === '42') fetch('https://uptime.betterstack.com/api/v1/heartbeat/kKUC4oNPdCzkzrGdvrme2qFj');
	if (newApexT11Document.agency_id === '43') fetch('https://uptime.betterstack.com/api/v1/heartbeat/JbKYJFEncKTcitouz7fVZCki');
	if (newApexT11Document.agency_id === '44') fetch('https://uptime.betterstack.com/api/v1/heartbeat/8AqjCGLV34HeZSujBRHJbmg1');

	//
};
