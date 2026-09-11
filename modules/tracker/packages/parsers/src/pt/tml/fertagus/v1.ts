/* * */

import { type RawVehicleEventPtTmlFertagusV1, type SimplifiedVehicleEvent, SimplifiedVehicleEventSchema } from '@tmlmobilidade/go-types-vehicle-events';
import { Dates } from '@tmlmobilidade/go-utils-dates';

import { findTripId } from './find-trip-id.js';

/* * */

export async function parseRawVehicleEventPtTmlFertagusV1(doc: RawVehicleEventPtTmlFertagusV1): Promise<null | SimplifiedVehicleEvent> {
	//

	//
	// Return null if the document is invalid.
	if (doc.payload.latitude == null || doc.payload.longitude == null || !doc.payload.train_id) return null;

	// Find the trip ID for the event.
	const tripId = await findTripId(doc.payload);
	if (!tripId) return null;

	// Parse the event.
	return SimplifiedVehicleEventSchema.parse({
		_id: doc._id,
		agency_id: doc.agency_id,
		bearing: null,
		created_at: doc.created_at,
		current_status: 'IN_TRANSIT_TO',
		driver_id: null,
		extra_trip_id: null,
		geohash: null,
		latitude: doc.payload.latitude,
		longitude: doc.payload.longitude,
		odometer: null,
		operational_date: Dates.fromUnixMilliseconds(doc.created_at).operational_date_int,
		received_at: doc.received_at,
		speed: null,
		stop_id: null,
		trip_id: tripId,
		vehicle_id: doc.payload.train_id.toString(),
	});
}
