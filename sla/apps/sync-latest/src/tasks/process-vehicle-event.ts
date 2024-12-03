/* * */

import LOGGER from '@helperkits/logger';
import { MongoDbWriter } from '@helperkits/writer';
import { vehicleEvents } from '@tmlmobilidade/services/interfaces';
import { emailProvider } from '@tmlmobilidade/services/providers';
import { CreateVehicleEventDto } from '@tmlmobilidade/services/types';
import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { DateTime } from 'luxon';

/* * */

const vehicleEventsDbWritter = new MongoDbWriter('VehicleEvents', await vehicleEvents.getCollection(), { batch_size: 1000 });

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

	await vehicleEventsDbWritter.write(newVehicleEventDocument, { filter: { _id: newVehicleEventDocument._id }, upsert: true });

	//
};
