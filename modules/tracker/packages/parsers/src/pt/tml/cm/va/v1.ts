/* * */

import { type RawVehicleEventPtTmlCmVaV1, type SimplifiedVehicleEvent, SimplifiedVehicleEventSchema } from '@tmlmobilidade/go-types-vehicle-events';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

export async function parseRawVehicleEventPtTmlCmVaV1(doc: RawVehicleEventPtTmlCmVaV1): Promise<null | SimplifiedVehicleEvent> {
	return SimplifiedVehicleEventSchema.parse({
		_id: doc._id,
		agency_id: doc.agency_id,
		bearing: doc.payload.vehicle.position.bearing ?? null,
		created_at: doc.created_at,
		current_status: doc.payload.vehicle.currentStatus ?? null,
		driver_id: doc.payload.vehicle.vehicle.driverId,
		extra_trip_id: doc.payload.vehicle.trip?.extraTripId ?? null,
		geohash: null,
		latitude: doc.payload.vehicle.position.latitude,
		longitude: doc.payload.vehicle.position.longitude,
		odometer: doc.payload.vehicle.position.odometer && doc.payload.vehicle.position.odometer >= 0 ? doc.payload.vehicle.position.odometer : null, // VA sends -1 when no odometer is available,
		operational_date: Dates.fromUnixMilliseconds(doc.created_at).operational_date_int,
		received_at: doc.received_at,
		speed: doc.payload.vehicle.position.speed,
		stop_id: doc.payload.vehicle.stopId ?? null,
		trip_id: doc.payload.vehicle.trip?.tripId ?? null,
		vehicle_id: doc.payload.vehicle.vehicle._id,
	});
}
