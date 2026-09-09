import { type MotisItinerary, type MotisPlanLeg, type RoutePlannerLocation } from '@/types/route-planner/models';
import { getMotisLegPathPositions, getMotisPlanPlacePosition } from '@/utils/route-planner/itinerary/geometry';
import { getDurationMinutes } from '@/utils/route-planner/presentation/format';
import { isMotisWalkingLeg } from '@/utils/route-planner/presentation/modes';

/* * */

interface GetRoutePlannerActiveLegProgressOptions {
	destination: null | RoutePlannerLocation
	itinerary: MotisItinerary | null
	origin: null | RoutePlannerLocation
	userPosition: GeoJSON.Position | null
}

export interface RoutePlannerActiveLegProgress {
	activeLeg: MotisPlanLeg | null
	activeLegIndex: number
	isTrackingLocation: boolean
	remainingDistanceMeters: null | number
	remainingMinutes: null | number
}

/* * */

export function getRoutePlannerActiveLegProgress({ destination, itinerary, origin, userPosition }: GetRoutePlannerActiveLegProgressOptions): RoutePlannerActiveLegProgress {
	const legs = itinerary?.legs ?? [];
	const activeLegIndex = itinerary && userPosition && legs.length > 0
		? getMotisItineraryActiveLegIndex(itinerary, userPosition, origin, destination)
		: 0;
	const activeLeg = legs[activeLegIndex] ?? legs[0] ?? null;

	if (!activeLeg) {
		return {
			activeLeg: null,
			activeLegIndex,
			isTrackingLocation: Boolean(userPosition),
			remainingDistanceMeters: null,
			remainingMinutes: null,
		};
	}

	const remainingSeconds = userPosition
		? getMotisLegRemainingSeconds(activeLeg, userPosition)
		: activeLeg.duration;

	return {
		activeLeg,
		activeLegIndex,
		isTrackingLocation: Boolean(userPosition),
		remainingDistanceMeters: getMotisLegRemainingDistanceMeters(activeLeg, userPosition),
		remainingMinutes: getDurationMinutes(remainingSeconds),
	};
}

/**
 * Finds which leg of the itinerary the user is currently closest to, so the UI can highlight
 * the "current step" while navigating. This is a simple nearest-path heuristic (not a full
 * map-matching / route-snapping algorithm): for each leg we measure the shortest distance from
 * the user's position to that leg's path (geometry, or a straight line fallback), and pick the
 * leg with the smallest distance.
 */
export function getMotisItineraryActiveLegIndex(itinerary: MotisItinerary, userPosition: GeoJSON.Position, origin: null | RoutePlannerLocation, destination: null | RoutePlannerLocation) {
	const legs = itinerary.legs;
	if (legs.length === 0) return 0;

	let closestLegIndex = 0;
	let closestDistanceMeters = Infinity;

	legs.forEach((leg, index) => {
		const positions = getMotisLegPathPositions(leg, index, legs.length, origin, destination);
		const distanceMeters = getDistanceToPathMeters(userPosition, positions);

		if (distanceMeters < closestDistanceMeters) {
			closestDistanceMeters = distanceMeters;
			closestLegIndex = index;
		}
	});

	return closestLegIndex;
}

/**
 * Estimates how many seconds are left on a walking leg based on the user's live distance to its
 * end point, using the leg's own planned pace (distance / duration) as the walking speed. Falls
 * back to a typical walking speed (~1.35 m/s) when the leg has no distance, and to the full
 * planned duration for non-walking legs (their progress isn't distance-estimated here).
 */
export function getMotisLegRemainingSeconds(leg: MotisPlanLeg, userPosition: GeoJSON.Position) {
	const totalSeconds = leg.duration;
	if (!isMotisWalkingLeg(leg)) return totalSeconds;

	const endPosition = getMotisPlanPlacePosition(leg.to);
	if (!endPosition) return totalSeconds;

	const defaultWalkingSpeedMetersPerSecond = 1.35;
	const plannedDistanceMeters = Number.isFinite(leg.distance) ? leg.distance as number : undefined;
	const walkingSpeedMetersPerSecond = plannedDistanceMeters && totalSeconds
		? plannedDistanceMeters / totalSeconds
		: defaultWalkingSpeedMetersPerSecond;

	const remainingMeters = getHaversineDistanceMeters(userPosition, endPosition);
	const remainingSeconds = Math.round(remainingMeters / walkingSpeedMetersPerSecond);

	return Math.max(0, Math.min(totalSeconds, remainingSeconds));
}

export function getMotisLegRemainingDistanceMeters(leg: MotisPlanLeg, userPosition: GeoJSON.Position | null) {
	if (!isMotisWalkingLeg(leg)) return null;

	const plannedDistanceMeters = Number.isFinite(leg.distance) ? leg.distance as number : null;
	if (!userPosition) return plannedDistanceMeters;

	const endPosition = getMotisPlanPlacePosition(leg.to);
	if (!endPosition) return plannedDistanceMeters;

	const remainingMeters = getHaversineDistanceMeters(userPosition, endPosition);
	return Math.round(plannedDistanceMeters === null ? remainingMeters : Math.min(plannedDistanceMeters, remainingMeters));
}

export function getHaversineDistanceMeters(positionA: GeoJSON.Position, positionB: GeoJSON.Position) {
	const earthRadiusMeters = 6371000;
	const [lonA, latA] = positionA;
	const [lonB, latB] = positionB;
	const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

	const deltaLat = toRadians(latB - latA);
	const deltaLon = toRadians(lonB - lonA);
	const haversine = (Math.sin(deltaLat / 2) ** 2) + (Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * (Math.sin(deltaLon / 2) ** 2));

	return 2 * earthRadiusMeters * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

/* * */

function getDistanceToPathMeters(point: GeoJSON.Position, positions: GeoJSON.Position[]) {
	if (positions.length === 0) return Infinity;
	if (positions.length === 1) return getHaversineDistanceMeters(point, positions[0]);

	let minDistanceMeters = Infinity;

	for (let i = 0; i < positions.length - 1; i++) {
		const distanceMeters = getDistanceToSegmentMeters(point, positions[i], positions[i + 1]);
		if (distanceMeters < minDistanceMeters) minDistanceMeters = distanceMeters;
	}

	return minDistanceMeters;
}

// Projects onto a local planar approximation (equirectangular) around the segment start.
// Accurate enough for the short segments found in a single leg's geometry.
function getDistanceToSegmentMeters(point: GeoJSON.Position, segmentStart: GeoJSON.Position, segmentEnd: GeoJSON.Position) {
	const metersPerDegreeLat = 111320;
	const metersPerDegreeLon = 111320 * Math.cos((segmentStart[1] * Math.PI) / 180);

	const toLocalMeters = (position: GeoJSON.Position): [number, number] => [
		(position[0] - segmentStart[0]) * metersPerDegreeLon,
		(position[1] - segmentStart[1]) * metersPerDegreeLat,
	];

	const localPoint = toLocalMeters(point);
	const localEnd = toLocalMeters(segmentEnd);

	const segmentLengthSquared = (localEnd[0] ** 2) + (localEnd[1] ** 2);
	if (segmentLengthSquared === 0) return Math.sqrt((localPoint[0] ** 2) + (localPoint[1] ** 2));

	const projection = Math.max(0, Math.min(1, ((localPoint[0] * localEnd[0]) + (localPoint[1] * localEnd[1])) / segmentLengthSquared));
	const closestPoint: [number, number] = [localEnd[0] * projection, localEnd[1] * projection];

	return Math.sqrt(((localPoint[0] - closestPoint[0]) ** 2) + ((localPoint[1] - closestPoint[1]) ** 2));
}
