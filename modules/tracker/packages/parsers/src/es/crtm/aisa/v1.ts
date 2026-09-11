/* * */

import { type RawVehicleEventEsCrtmAisaV1, type SimplifiedVehicleEvent, SimplifiedVehicleEventSchema } from '@tmlmobilidade/go-types-vehicle-events';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

export async function parseRawVehicleEventEsCrtmAisaV1(doc: RawVehicleEventEsCrtmAisaV1): Promise<null | SimplifiedVehicleEvent> {
	return SimplifiedVehicleEventSchema.parse({
		_id: doc._id,
		agency_id: doc.agency_id,
		bearing: doc.payload.vehicle.position.bearing ?? null,
		created_at: doc.created_at,
		current_status: doc.payload.vehicle.current_status ?? null,
		driver_id: null,
		extra_trip_id: null,
		geohash: null,
		latitude: doc.payload.vehicle.position.latitude,
		longitude: doc.payload.vehicle.position.longitude,
		odometer: doc.payload.vehicle.position.odometer ?? null,
		operational_date: Dates.fromUnixMilliseconds(doc.created_at).operational_date_int,
		received_at: doc.received_at,
		speed: doc.payload.vehicle.position.speed ?? null,
		stop_id: doc.payload.vehicle.stop_id ?? null,
		trip_id: doc.payload.vehicle.trip.trip_id,
		vehicle_id: doc.payload.vehicle.vehicle.id,
	});
}
