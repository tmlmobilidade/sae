import { type RoutePlannerLocation, type RoutePlannerTravelTime } from '@/types/route-planner/models';
import { getMotisPlaceParam } from '@/utils/search/motis-geocode';

/* * */

export function buildMotisPlanParams(origin: RoutePlannerLocation, destination: RoutePlannerLocation, travelTime: RoutePlannerTravelTime) {
	const requestDate = travelTime.mode === 'now' ? new Date() : travelTime.date;

	const params = new URLSearchParams({
		detailedLegs: 'true',
		directModes: 'WALK',
		fromPlace: getMotisPlaceParam(origin),
		maxItineraries: '10',
		postTransitModes: 'WALK',
		preTransitModes: 'WALK',
		time: requestDate.toISOString(),
		toPlace: getMotisPlaceParam(destination),
		transitModes: 'TRANSIT',
	});

	if (travelTime.mode === 'arrival') params.set('arriveBy', 'true');

	return params;
}
