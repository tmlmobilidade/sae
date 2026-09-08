/* * */

import { type HubVehiclePosition } from '@tmlmobilidade/go-types-hub';
import { type Vehicle } from '@tmlmobilidade/go-types-operation';
import { type SimplifiedVehicleEvent } from '@tmlmobilidade/go-types-vehicle-events';

/* * */

/**
 * Converts a SimplifiedVehicleEvent object into a GeoJSON Feature of type Point.
 *
 * @param vehiclePositionData - Object containing vehicle position and metadata.
 * @returns A GeoJSON Feature representing the vehicle's geographic location and associated properties.
 *
 * Properties embedded in the feature:
 * - agency_id: ID of the agency the vehicle belongs to
 * - bearing:   Heading in degrees
 * - id:        Vehicle identifier (duplicated for GeoJSON "properties.id" key)
 * - lat:       Vehicle latitude
 * - lon:       Vehicle longitude
 * - trip_id:   Associated trip identifier
 */
export function transformVehicleDataIntoGeoJsonFeature<T extends HubVehiclePosition | SimplifiedVehicleEvent>(event: T, vehicleData?: Vehicle): GeoJSON.Feature<GeoJSON.Point, Partial<Vehicle> & T> {
	return {
		geometry: {
			coordinates: [event.longitude, event.latitude],
			type: 'Point',
		},
		id: `${event.agency_id}-${event.vehicle_id}`,
		properties: {
			...(vehicleData ?? {}),
			...event,
		},
		type: 'Feature',
	};
}
