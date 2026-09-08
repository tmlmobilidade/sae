import { getBaseGeoJsonFeatureCollection } from '@tmlmobilidade/geo';
import { type HubVehiclePosition } from '@tmlmobilidade/go-types-hub';

/* * */

const ALLOWED_VEHICLE_AGENCY_IDS = new Set([
	'7NTB1', // Fertagus
	'A2L1N', // Alsa (CM)
	'A3H3M', // TCB
	'BNA17', // Rodoviária de Lisboa (CM)
	'HF16N', // MobiCascais
	'IA2N9', // Metro de Lisboa
	'IA9T6', // Carris
	'KB1F6', // Metro Transportes do Sul
	'LA77N', // Viação Alvorada (CM)
	'LTP61', // Transtejo
	'N18KL', // Comboios de Portugal
	'YA15B', // TST (CM)
]);

/* * */

export function buildVehiclesFeatureCollection(vehicles: HubVehiclePosition[]): GeoJSON.FeatureCollection<GeoJSON.Point, HubVehiclePosition> {
	const collection = getBaseGeoJsonFeatureCollection<GeoJSON.Point, HubVehiclePosition>();

	for (const vehicle of vehicles) {
		if (!isVehicleIncludedInMap(vehicle)) continue;
		collection.features.push(transformVehicleDataIntoGeoJsonFeature(vehicle));
	}

	return collection;
}

export function isVehicleIncludedInMap(vehicle: HubVehiclePosition) {
	if (!ALLOWED_VEHICLE_AGENCY_IDS.has(vehicle.agency_id)) return false;
	if (!vehicle.trip_id || !vehicle.route_id) return false;
	return vehicle.direction_id !== undefined && vehicle.direction_id !== null;
}

/* * */

export function transformVehicleDataIntoGeoJsonFeature(vehicle: HubVehiclePosition): GeoJSON.Feature<GeoJSON.Point, HubVehiclePosition> {
	return {
		geometry: {
			coordinates: [vehicle.longitude || 0, vehicle.latitude || 0],
			type: 'Point',
		},
		id: String(vehicle.vehicle_id),
		properties: vehicle,
		type: 'Feature',
	};
}
