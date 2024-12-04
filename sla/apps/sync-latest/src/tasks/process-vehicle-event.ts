/* * */

import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { MongoDbWriter } from '@helperkits/writer';
import { rides, vehicleEvents } from '@tmlmobilidade/services/interfaces';
import { emailProvider } from '@tmlmobilidade/services/providers';
import { CreateVehicleEventDto, OperationalDate } from '@tmlmobilidade/services/types';
import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { DateTime } from 'luxon';

/* * */

const vehicleEventsDbWritter = new MongoDbWriter('vehicle_events', await vehicleEvents.getCollection(), { batch_size: 500 });

/* * */

export async function processVehicleEvent(databaseOperation) {
	//

	//
	// Validate that the operation is an insert. Otherwise, send an email to the emergency contact.
	// Only insert operations are expected to occur in this PCGIDB collection.

	if (databaseOperation.operationType !== 'insert') {
		LOGGER.error('MAJOR ERROR: processVehicleEvent called with operationType different than "insert".');
		await emailProvider.send({
			subject: 'SLA ERROR',
			text: `
				<h4>processVehicleEvent called with operationType different than "insert".</h4>
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
	const vehicleTimestamp = DateTime.fromSeconds(pcgiDocument.content.entity[0].vehicle.timestamp);
	const operationalDate = getOperationalDate(vehicleTimestamp);

	//
	// Create a new vehicle event document and write it to the VehicleEvents collection

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
			const invalidationResult = await ridesCollection.updateMany({ operational_date: { $in: uniqueOperationalDates }, trip_id: { $in: uniqueTripIds } }, { $set: { status: 'complete' } });
			LOGGER.info(`SYNC LATEST [vehicle_events]: Marked ${invalidationResult.modifiedCount} Rides as 'pending' due to new vehicle_events data (${invalidationTimer.get()})`);
			LOGGER.divider();
		}
		catch (error) {
			LOGGER.error('Error in flushCallback', error);
		}
	};

	//
	// Write the new vehicle event document to the VehicleEvents collection

	await vehicleEventsDbWritter.write(newVehicleEventDocument, { filter: { _id: newVehicleEventDocument._id }, upsert: true }, () => null, flushCallback);

	//
};
