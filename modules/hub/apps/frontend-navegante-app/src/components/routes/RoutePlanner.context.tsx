'use client';

import { useLinesData } from '@/components/lines/use-lines-data';
import { useRoutePlannerOrigin } from '@/components/routes/use-route-planner-origin';
import { useRoutePlannerPlanData } from '@/components/routes/use-route-planner-plan-data';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';
import { type MotisItinerary, type RoutePlannerItineraryMapData, type RoutePlannerLocation, type RoutePlannerLocationSearchReturnView, type RoutePlannerLocationSearchTarget, type RoutePlannerPlanViewMode, type RoutePlannerTravelTime, type RoutePlannerTravelTimeMode, type RoutePlannerViewMode } from '@/types/route-planner/models';
import { buildRoutePlannerItineraryMapData } from '@/utils/route-planner/itinerary/geometry';
import { getRoutePlannerTravelTimeModeTransition } from '@/utils/route-planner/planning/navigation';
import { clearSearchDraft } from '@/utils/search/search-draft';
import { createContext, type PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

/* * */

export type { RoutePlannerLocationSearchTarget, RoutePlannerViewMode } from '@/types/route-planner/models';

interface RoutePlannerPlanOptions {
	destination?: null | RoutePlannerLocation
	origin?: null | RoutePlannerLocation
	travelTime?: RoutePlannerTravelTime
	viewMode?: RoutePlannerPlanViewMode
}

interface RoutePlannerContextState {
	actions: {
		clearRoute: () => void
		dismissTripSheets: () => void
		endActiveTrip: () => void
		openActiveTripDetail: () => void
		openDirectionsTo: (location: RoutePlannerLocation) => Promise<void>
		openLocationSearch: (target: RoutePlannerLocationSearchTarget) => void
		openPlace: (location: RoutePlannerLocation) => Promise<void>
		openPlaceDetail: () => void
		openResults: () => void
		planRoute: (options?: RoutePlannerPlanOptions) => Promise<void>
		selectDestination: (location: RoutePlannerLocation) => Promise<void>
		selectItinerary: (index: number) => void
		selectOrigin: (location: RoutePlannerLocation) => Promise<void>
		setTravelTime: (date: Date) => void
		setTravelTimeMode: (mode: RoutePlannerTravelTimeMode) => void
		startItinerary: (index: number) => void
		swapLocations: () => void
	}
	data: {
		destination: null | RoutePlannerLocation
		itineraries: MotisItinerary[]
		location_search_return_view: RoutePlannerLocationSearchReturnView
		location_search_target: RoutePlannerLocationSearchTarget
		origin: null | RoutePlannerLocation
		plan_error: null | string
		route_map_data: RoutePlannerItineraryMapData
		selected_itinerary: MotisItinerary | null
		selected_itinerary_index: null | number
		travel_time: RoutePlannerTravelTime
		view_mode: RoutePlannerViewMode
		was_opened_from_place: boolean
	}
	flags: {
		is_navigating: boolean
		is_planning: boolean
	}
}

/* * */

const RoutePlannerContext = createContext<RoutePlannerContextState | undefined>(undefined);

export function useRoutePlannerContext() {
	const context = useContext(RoutePlannerContext);

	if (!context) {
		throw new Error('useRoutePlannerContext must be used within a RoutePlannerContextProvider');
	}

	return context;
}

/* * */

export function RoutePlannerContextProvider({ children }: PropsWithChildren) {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();
	const { activeBottomSheet, clear, push, replaceActive } = useBottomSheet();
	const { data: lines } = useLinesData();
	const { resolveOrigin } = useRoutePlannerOrigin();
	const { isLoading: isPlanning, itineraries, requestPlan, reset: resetPlanRequest } = useRoutePlannerPlanData();

	const [destination, setDestinationState] = useState<null | RoutePlannerLocation>(null);
	const [origin, setOriginState] = useState<null | RoutePlannerLocation>(null);
	const [planError, setPlanError] = useState<null | string>(null);
	const [selectedItineraryIndex, setSelectedItineraryIndex] = useState<null | number>(0);
	const [travelTime, setTravelTimeState] = useState<RoutePlannerTravelTime>(() => ({ date: new Date(), mode: 'now' }));
	const [viewMode, setViewMode] = useState<RoutePlannerViewMode>('destination-search');
	const [locationSearchReturnView, setLocationSearchReturnView] = useState<RoutePlannerLocationSearchReturnView>('results');
	const [locationSearchTarget, setLocationSearchTarget] = useState<RoutePlannerLocationSearchTarget>('destination');
	const [wasOpenedFromPlace, setWasOpenedFromPlace] = useState(false);
	const [isNavigating, setIsNavigating] = useState(false);

	//
	// B. Transform data

	const selectedItinerary = itineraries[selectedItineraryIndex] ?? null;

	const routeMapData = useMemo(() => {
		const lineStyleByShortName = new Map(
			lines.map(line => [
				line.short_name,
				{
					color: line.color,
					text_color: line.text_color,
				},
			]),
		);

		return buildRoutePlannerItineraryMapData(selectedItinerary, origin, destination, { lineStyleByShortName });
	}, [destination, lines, origin, selectedItinerary]);

	//
	// C. Handle actions

	const openRouteSheet = useCallback(() => {
		if (activeBottomSheet?.view === 'routes') {
			replaceActive({ view: 'routes' });
			return;
		}

		push({ view: 'routes' });
	}, [activeBottomSheet?.view, push, replaceActive]);

	const invalidatePlanResult = useCallback(() => {
		resetPlanRequest();
		setPlanError(null);
		setSelectedItineraryIndex(0);
	}, [resetPlanRequest]);

	const clearRoute = useCallback(() => {
		invalidatePlanResult();
		setOriginState(null);
		setDestinationState(null);
		setViewMode('destination-search');
		setLocationSearchReturnView('results');
		setWasOpenedFromPlace(false);
		setIsNavigating(false);
	}, [invalidatePlanResult]);

	const planRoute = useCallback(async (options: RoutePlannerPlanOptions = {}) => {
		const requestOrigin = options.origin === undefined ? origin : options.origin;
		const requestDestination = options.destination === undefined ? destination : options.destination;
		const requestTravelTime = options.travelTime ?? travelTime;
		const nextViewMode = options.viewMode ?? 'results';

		if (!requestOrigin || !requestDestination) {
			resetPlanRequest();
			setPlanError(t('default:routes.RoutePlanner.errors.missing_locations'));
			return;
		}

		resetPlanRequest();
		setPlanError(null);
		setIsNavigating(false);
		setSelectedItineraryIndex(nextViewMode === 'place-detail' ? null : 0);
		setViewMode(nextViewMode);

		try {
			const data = await requestPlan({
				destination: requestDestination,
				origin: requestOrigin,
				travelTime: requestTravelTime,
			});

			if (data.itineraries.length === 0) setPlanError(t('default:routes.RoutePlanner.errors.no_itineraries'));
		} catch {
			setPlanError(t('default:routes.RoutePlanner.errors.unknown'));
			setViewMode(nextViewMode);
		}
	}, [destination, origin, requestPlan, resetPlanRequest, t, travelTime]);

	const startItinerary = useCallback((index: number) => {
		setSelectedItineraryIndex(index);
		setIsNavigating(true);
		setViewMode('itinerary-detail');
		clear();
	}, [clear]);

	const endActiveTrip = useCallback(() => {
		clearRoute();
		clearSearchDraft();
		clear();
	}, [clear, clearRoute]);

	const dismissTripSheets = useCallback(() => {
		clear();
	}, [clear]);

	const openActiveTripDetail = useCallback(() => {
		setViewMode('itinerary-detail');
		replaceActive({ view: 'routes' });
	}, [replaceActive]);

	const openLocationSearch = useCallback((target: RoutePlannerLocationSearchTarget) => {
		setLocationSearchTarget(target);
		if (viewMode !== 'destination-search') {
			setLocationSearchReturnView(viewMode === 'place-detail' ? 'place-detail' : 'results');
		}
		setViewMode('destination-search');
		replaceActive({ view: 'routes' });
	}, [replaceActive, viewMode]);

	const openResults = useCallback(() => {
		setIsNavigating(false);
		setViewMode('results');
	}, []);

	const openPlace = useCallback(async (location: RoutePlannerLocation) => {
		invalidatePlanResult();
		setDestinationState(location);
		setSelectedItineraryIndex(null);
		setViewMode('place-detail');
		setLocationSearchReturnView('place-detail');
		setWasOpenedFromPlace(true);
		openRouteSheet();

		const nextOrigin = await resolveOrigin(origin);
		if (!nextOrigin) {
			setLocationSearchTarget('origin');
			setViewMode('destination-search');
			return;
		}

		setOriginState(nextOrigin);
		await planRoute({ destination: location, origin: nextOrigin, viewMode: 'place-detail' });
	}, [invalidatePlanResult, openRouteSheet, origin, planRoute, resolveOrigin]);

	const openPlaceDetail = useCallback(() => {
		setSelectedItineraryIndex(null);
		setViewMode('place-detail');
	}, []);

	const selectDestination = useCallback(async (location: RoutePlannerLocation) => {
		const nextViewMode = viewMode === 'destination-search' ? locationSearchReturnView : 'results';
		invalidatePlanResult();
		setDestinationState(location);
		setWasOpenedFromPlace(nextViewMode === 'place-detail');

		const nextOrigin = await resolveOrigin(origin);
		if (!nextOrigin) {
			setLocationSearchReturnView(nextViewMode);
			setLocationSearchTarget('origin');
			setViewMode('destination-search');
			return;
		}

		setOriginState(nextOrigin);
		await planRoute({ destination: location, origin: nextOrigin, viewMode: nextViewMode });
	}, [invalidatePlanResult, locationSearchReturnView, origin, planRoute, resolveOrigin, viewMode]);

	const openDirectionsTo = useCallback(async (location: RoutePlannerLocation) => {
		setViewMode('results');
		openRouteSheet();
		await selectDestination(location);
	}, [openRouteSheet, selectDestination]);

	const selectOrigin = useCallback(async (location: RoutePlannerLocation) => {
		const nextViewMode = viewMode === 'destination-search' ? locationSearchReturnView : 'results';
		invalidatePlanResult();
		setOriginState(location);

		if (!destination) {
			setLocationSearchReturnView('results');
			setLocationSearchTarget('destination');
			setWasOpenedFromPlace(false);
			setViewMode('destination-search');
			return;
		}

		await planRoute({ destination, origin: location, viewMode: nextViewMode });
	}, [destination, invalidatePlanResult, locationSearchReturnView, planRoute, viewMode]);

	const selectItinerary = useCallback((index: number) => {
		setSelectedItineraryIndex(index);
		if (viewMode === 'place-detail') setViewMode('results');
	}, [viewMode]);

	const setTravelTime = useCallback((date: Date) => {
		invalidatePlanResult();
		setTravelTimeState(current => ({ ...current, date }));
	}, [invalidatePlanResult]);

	const setTravelTimeMode = useCallback((mode: RoutePlannerTravelTimeMode) => {
		invalidatePlanResult();
		setTravelTimeState(current => getRoutePlannerTravelTimeModeTransition(current, mode));
	}, [invalidatePlanResult]);

	const swapLocations = useCallback(() => {
		const nextOrigin = destination;
		const nextDestination = origin;

		invalidatePlanResult();
		setOriginState(nextOrigin);
		setDestinationState(nextDestination);
		setLocationSearchReturnView('results');
		setWasOpenedFromPlace(false);

		if (!nextOrigin || !nextDestination) {
			setLocationSearchTarget(nextOrigin ? 'destination' : 'origin');
			setViewMode('destination-search');
			return;
		}

		void planRoute({ destination: nextDestination, origin: nextOrigin });
	}, [destination, invalidatePlanResult, origin, planRoute]);

	//
	// D. Define context value

	const contextValue = useMemo<RoutePlannerContextState>(() => ({
		actions: {
			clearRoute,
			dismissTripSheets,
			endActiveTrip,
			openActiveTripDetail,
			openDirectionsTo,
			openLocationSearch,
			openPlace,
			openPlaceDetail,
			openResults,
			planRoute,
			selectDestination,
			selectItinerary,
			selectOrigin,
			setTravelTime,
			setTravelTimeMode,
			startItinerary,
			swapLocations,
		},
		data: {
			destination,
			itineraries,
			location_search_return_view: locationSearchReturnView,
			location_search_target: locationSearchTarget,
			origin,
			plan_error: planError,
			route_map_data: routeMapData,
			selected_itinerary: selectedItinerary,
			selected_itinerary_index: selectedItineraryIndex,
			travel_time: travelTime,
			view_mode: viewMode,
			was_opened_from_place: wasOpenedFromPlace,
		},
		flags: {
			is_navigating: isNavigating,
			is_planning: isPlanning,
		},
	}), [clearRoute, destination, dismissTripSheets, endActiveTrip, isNavigating, isPlanning, itineraries, locationSearchReturnView, locationSearchTarget, openActiveTripDetail, openDirectionsTo, openLocationSearch, openPlace, openPlaceDetail, openResults, origin, planError, planRoute, routeMapData, selectDestination, selectedItinerary, selectedItineraryIndex, selectItinerary, selectOrigin, setTravelTime, setTravelTimeMode, startItinerary, swapLocations, travelTime, viewMode, wasOpenedFromPlace]);

	//
	// E. Render components

	return (
		<RoutePlannerContext.Provider value={contextValue}>
			{children}
		</RoutePlannerContext.Provider>
	);

	//
}
