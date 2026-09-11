/* * */

import { type RawVehicleEventPtTmpUnirUt5V1, type SimplifiedVehicleEvent, SimplifiedVehicleEventSchema } from '@tmlmobilidade/go-types-vehicle-events';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

export async function parseRawVehicleEventPtTmpUnirUt5V1(doc: RawVehicleEventPtTmpUnirUt5V1): Promise<null | SimplifiedVehicleEvent> {
	return SimplifiedVehicleEventSchema.parse({
		_id: doc._id,
		agency_id: doc.agency_id,
		bearing: null,
		created_at: doc.created_at,
		current_status: null,
		driver_id: null,
		extra_trip_id: null,
		geohash: null,
		latitude: doc.payload.latitude,
		longitude: doc.payload.longitude,
		odometer: null,
		operational_date: Dates.fromUnixMilliseconds(doc.created_at).operational_date_int,
		received_at: doc.received_at,
		speed: doc.payload.velocity || null,
		stop_id: doc.payload.stopPointRef || null,
		trip_id: doc.payload.codigoServico,
		vehicle_id: doc.payload.numeroIdentificacaoVeiculo,
	});
}
