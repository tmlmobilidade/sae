/* * */

import { buffer, point } from '@turf/turf';

/**
 * Create a geofence around a given point with a given radius in meters (default is 30 meters).
 * @param latitude
 * @param longitude
 * @param radius (default is 30 meters)
 * @returns The GeoJSON Feature of a Polygon.
 */
export function createGeofence(longitude: number, latitude: number, radius = 30): GeoJSON.Feature<GeoJSON.Polygon> {
	const firstStopTurfPoint = point([longitude, latitude]);
	return buffer(firstStopTurfPoint, radius, { units: 'meters' }) as GeoJSON.Feature<GeoJSON.Polygon>;
}
