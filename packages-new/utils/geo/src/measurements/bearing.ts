/* * */

import { type GeoJson2dPosition } from '@tmlmobilidade/go-types-geo';
import { type Degrees, DegreesSchema } from '@tmlmobilidade/go-types-shared';

/**
 * Calculates the bearing between two positions.
 * @param currentPosition The current position.
 * @param previousPosition The previous position.
 * @returns The bearing in degrees.
 */
export function calculateBearingInDegrees(currentPosition: GeoJson2dPosition, previousPosition: GeoJson2dPosition): Degrees {
	//

	//
	// Convert the positions to radians

	const lat1 = previousPosition[1] * Math.PI / 180;
	const lon1 = previousPosition[0] * Math.PI / 180;
	const lat2 = currentPosition[1] * Math.PI / 180;
	const lon2 = currentPosition[0] * Math.PI / 180;

	//
	// Calculate the delta longitude

	const deltaLon = lon2 - lon1;

	//
	// Calculate the y and x components of the bearing

	const y = Math.sin(deltaLon) * Math.cos(lat2);

	const x =
		Math.cos(lat1) * Math.sin(lat2) -
		Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

	//
	// Calculate the bearing in degrees

	const bearing = Math.atan2(y, x) * 180 / Math.PI;

	return DegreesSchema.parse((bearing + 360) % 360);
}
