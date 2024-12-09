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
		_raw: JSON.stringify(pcgiDoc),
		agency_id: pcgiDoc.content.entity[0].vehicle.agencyId,
		created_at: vehicleTimestamp.toJSDate(),
		driver_id: pcgiDoc.content.entity[0].vehicle.driverId,
		event_id: pcgiDoc.content.entity[0]._id,
		extra_trip_id: pcgiDoc.content.entity[0].vehicle.trip?.extraTripId,
		line_id: pcgiDoc.content.entity[0].vehicle.trip?.lineId,
		odometer: pcgiDoc.content.entity[0].vehicle.position.odometer,
		operational_date: operationalDate,
		pattern_id: pcgiDoc.content.entity[0].vehicle.trip?.patternId,
		received_at: DateTime.fromMillis(pcgiDoc.millis).toJSDate(),
		route_id: pcgiDoc.content.entity[0].vehicle.trip?.routeId,
		stop_id: pcgiDoc.content.entity[0].vehicle.stopId,
		trip_id: pcgiDoc.content.entity[0].vehicle.trip?.tripId,
		updated_at: DateTime.fromMillis(pcgiDoc.millis).toJSDate(),
		vehicle_id: pcgiDoc.content.entity[0].vehicle.vehicle._id,
	};

	//
}
