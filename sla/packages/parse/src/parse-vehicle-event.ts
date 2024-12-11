/* * */

import type { VehicleEvent } from '@tmlmobilidade/services/types';

import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { DateTime } from 'luxon';

/* * */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseVehicleEvent(pcgiDoc: any): VehicleEvent {
	//

	const vehicleTimestamp = DateTime.fromSeconds(pcgiDoc.content.entity[0].vehicle.timestamp);

	const operationalDate = getOperationalDate(vehicleTimestamp);

	return {
		_id: pcgiDoc._id,
		agency_id: pcgiDoc.content.entity[0].vehicle.agencyId,
		created_at: vehicleTimestamp.toJSDate(),
		driver_id: pcgiDoc.content.entity[0].vehicle.driverId,
		event_id: pcgiDoc.content.entity[0]._id,
		extra_trip_id: pcgiDoc.content.entity[0].vehicle.trip?.extraTripId,
		latitude: pcgiDoc.content.entity[0].vehicle.position.latitude,
		longitude: pcgiDoc.content.entity[0].vehicle.position.longitude,
		odometer: pcgiDoc.content.entity[0].vehicle.position.odometer,
		operational_date: operationalDate,
		pattern_id: pcgiDoc.content.entity[0].vehicle.trip?.patternId,
		received_at: DateTime.fromMillis(pcgiDoc.millis).toJSDate(),
		stop_id: pcgiDoc.content.entity[0].vehicle.stopId,
		trigger_activity: pcgiDoc.content.entity[0].vehicle.trigger.activity,
		trigger_door: pcgiDoc.content.entity[0].vehicle.trigger.door,
		trip_id: pcgiDoc.content.entity[0].vehicle.trip?.tripId,
		updated_at: DateTime.fromMillis(pcgiDoc.millis).toJSDate(),
		vehicle_id: pcgiDoc.content.entity[0].vehicle.vehicle._id,
	};

	//
}
