import { type MotisItinerary } from '@/types/route-planner/models';
import { getMotisLegModeKind, isMotisWalkingLeg } from '@/utils/route-planner/presentation/modes';

/* * */

export type RoutePlannerModeFilter = 'bus' | 'ferry' | 'rail' | 'subway' | 'tram' | 'transit';
export type RoutePlannerSortMode = 'best' | 'fastest' | 'fewer_transfers' | 'least_walking';

export const ROUTE_PLANNER_MODE_FILTERS: RoutePlannerModeFilter[] = ['bus', 'rail', 'subway', 'tram', 'ferry', 'transit'];

export interface RoutePlannerVisibleItinerary {
	index: number
	itinerary: MotisItinerary
}

/* * */

export function getItineraryTransitModeFilters(itinerary: MotisItinerary): RoutePlannerModeFilter[] {
	const modes = itinerary.legs
		.filter(leg => !isMotisWalkingLeg(leg))
		.map(leg => normalizeModeFilter(getMotisLegModeKind(leg)));

	return Array.from(new Set(modes));
}

export function itineraryMatchesEnabledModes(itinerary: MotisItinerary, enabledModes: Set<RoutePlannerModeFilter>) {
	const modes = getItineraryTransitModeFilters(itinerary);
	return modes.length === 0 || modes.every(mode => enabledModes.has(mode));
}

export function sortVisibleItineraries(itineraries: RoutePlannerVisibleItinerary[], sortMode: RoutePlannerSortMode) {
	const results = [...itineraries];

	if (sortMode === 'fastest') {
		return results.sort((a, b) => a.itinerary.duration - b.itinerary.duration);
	}

	if (sortMode === 'fewer_transfers') {
		return results.sort((a, b) => a.itinerary.transfers - b.itinerary.transfers);
	}

	if (sortMode === 'least_walking') {
		return results.sort((a, b) => getItineraryWalkMinutes(a.itinerary) - getItineraryWalkMinutes(b.itinerary));
	}

	return results;
}

export function toggleRoutePlannerMode(enabledModes: Set<RoutePlannerModeFilter>, mode: RoutePlannerModeFilter) {
	const nextEnabledModes = new Set(enabledModes);

	if (nextEnabledModes.has(mode)) nextEnabledModes.delete(mode);
	else nextEnabledModes.add(mode);

	return nextEnabledModes.size > 0 ? nextEnabledModes : enabledModes;
}

/* * */

export function getItineraryWalkMinutes(itinerary: MotisItinerary) {
	const walkingSeconds = itinerary.legs.reduce((total, leg) => isMotisWalkingLeg(leg) ? total + leg.duration : total, 0);
	return Math.max(0, Math.round(walkingSeconds / 60));
}

function normalizeModeFilter(mode: string): RoutePlannerModeFilter {
	if (mode === 'bus') return 'bus';
	if (mode === 'ferry') return 'ferry';
	if (mode === 'rail') return 'rail';
	if (mode === 'subway') return 'subway';
	if (mode === 'tram') return 'tram';
	return 'transit';
}
