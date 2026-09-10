import { type RoutePlannerLocationSearchReturnView, type RoutePlannerTravelTime, type RoutePlannerTravelTimeMode, type RoutePlannerViewMode } from '@/types/route-planner/models';

/* * */

// NOTE: keep in sync with the itinerary-detail snap points array in RoutePlanner/index.tsx.
// Index 0 is reserved by react-modal-sheet as an alias for "closed", so the smallest visible
// snap point is index 1.
export const ROUTE_PLANNER_ITINERARY_DETAIL_SNAP = {
	compact: 1,
	full: 4,
	medium: 3,
	preview: 2,
};

export type RoutePlannerBackAction = 'open-place-detail' | 'open-results';
export type RoutePlannerDismissAction = 'clear-route' | 'dismiss-trip-sheets';

interface GetRoutePlannerBackActionOptions {
	hasRouteContext: boolean
	isNavigating: boolean
	locationSearchReturnView: RoutePlannerLocationSearchReturnView
	viewMode: RoutePlannerViewMode
	wasOpenedFromPlace: boolean
}

/* * */

export function getRoutePlannerBackAction({ hasRouteContext, isNavigating, locationSearchReturnView, viewMode, wasOpenedFromPlace }: GetRoutePlannerBackActionOptions): null | RoutePlannerBackAction {
	if (viewMode === 'itinerary-detail') return isNavigating ? null : 'open-results';
	if (viewMode === 'results') return wasOpenedFromPlace ? 'open-place-detail' : null;
	if (viewMode === 'destination-search' && locationSearchReturnView === 'place-detail') return 'open-place-detail';
	if (viewMode === 'destination-search' && hasRouteContext) return 'open-results';

	return null;
}

export function getRoutePlannerDismissAction({ isNavigating }: { isNavigating: boolean }): RoutePlannerDismissAction {
	return isNavigating ? 'dismiss-trip-sheets' : 'clear-route';
}

export function getRoutePlannerTravelTimeModeTransition(current: RoutePlannerTravelTime, mode: RoutePlannerTravelTimeMode, currentDate = new Date()): RoutePlannerTravelTime {
	return {
		date: mode === 'now' || current.mode === 'now' ? currentDate : current.date,
		mode,
	};
}

export function getRoutePlannerItineraryDetailInitialSnap(isNavigating: boolean) {
	return isNavigating ? ROUTE_PLANNER_ITINERARY_DETAIL_SNAP.compact : ROUTE_PLANNER_ITINERARY_DETAIL_SNAP.preview;
}

export function getRoutePlannerMapFitFeatures(features: GeoJSON.Feature<GeoJSON.LineString>[], viewMode: RoutePlannerViewMode) {
	if (viewMode !== 'itinerary-detail') return features;

	return features.slice(0, 1);
}
