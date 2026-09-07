import { type MotisItinerary } from '@/types/route-planner/models';
import { isMotisWalkingLeg } from '@/utils/route-planner/presentation/modes';
import { type HubVehiclePosition } from '@tmlmobilidade/go-types-hub';

/* * */

export function getRoutePlannerItineraryRouteDirections(itinerary: MotisItinerary | null) {
	const legs = Array.isArray(itinerary?.legs) ? itinerary.legs : [];
	const transitLegs = legs.filter(leg => !isMotisWalkingLeg(leg));

	if (transitLegs.length === 0) return null;

	return new Set(
		transitLegs
			.map(leg => getRoutePlannerRouteDirectionKey(leg.routeId, leg.directionId, leg.agencyId))
			.filter((routeDirection): routeDirection is string => routeDirection !== null),
	);
}

export function getRoutePlannerItineraryRouteIds(itinerary: MotisItinerary | null) {
	const legs = Array.isArray(itinerary?.legs) ? itinerary.legs : [];
	const transitLegs = legs.filter(leg => !isMotisWalkingLeg(leg));

	if (transitLegs.length === 0) return null;

	return new Set(
		transitLegs
			.map(leg => getRoutePlannerRouteIdKey(leg.routeId, leg.agencyId))
			.filter((routeId): routeId is string => routeId !== null),
	);
}

export function filterVehicleFeatureCollectionByRouteDirections(
	vehiclesData: GeoJSON.FeatureCollection<GeoJSON.Point, HubVehiclePosition>,
	routeDirections: null | Set<string>,
) {
	if (!routeDirections) return vehiclesData;

	return {
		...vehiclesData,
		features: vehiclesData.features.filter((feature) => {
			const vehicle = feature.properties;
			const routeDirection = getRoutePlannerRouteDirectionKey(vehicle?.route_id, vehicle?.direction_id, vehicle?.agency_id);
			return routeDirection !== null && routeDirections.has(routeDirection);
		}),
	};
}

export function getRoutePlannerRouteDirectionKey(routeId: null | string | undefined, directionId: null | number | string | undefined, agencyId: null | string | undefined) {
	const normalizedRouteId = getRoutePlannerRouteIdKey(routeId, agencyId);
	if (!normalizedRouteId || directionId === null || directionId === undefined || directionId === '') return null;

	const parsedDirectionId = Number(directionId);
	if (!Number.isInteger(parsedDirectionId)) return null;

	return `${normalizedRouteId}:${parsedDirectionId}`;
}

export function getRoutePlannerRouteIdKey(routeId: null | string | undefined, agencyId: null | string | undefined) {
	if (!routeId) return null;

	const publicRouteIdStart = routeId.indexOf('[');
	const routeIdWithoutDataset = publicRouteIdStart >= 0 ? routeId.slice(publicRouteIdStart) : routeId;

	return routeIdWithoutDataset.startsWith('[') || !agencyId
		? routeIdWithoutDataset
		: `[${agencyId}]${routeIdWithoutDataset}`;
}
