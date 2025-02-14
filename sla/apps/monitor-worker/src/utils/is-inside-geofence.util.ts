/* * */

import { booleanPointInPolygon, point } from '@turf/turf';

/**
 * Check if a given point is inside a given geofence.
 * @param longitude
 * @param latitude
 * @param geofence
 * @returns A boolean indicating if the point is inside the geofence.
 */
export function isInsideGeofence(longitude: number, latitude: number, geofence: GeoJSON.Feature<GeoJSON.Polygon>): boolean {
	const pointToCheck = point([longitude, latitude]);
	return booleanPointInPolygon(pointToCheck, geofence);
}
