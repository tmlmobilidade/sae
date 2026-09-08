'use client';

import { useLinesData } from '@/components/lines/use-lines-data';
import { useUserLocation } from '@/contexts/UserLocation.context';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';
import { type MotisItinerary, type MotisPlanResponse, type RoutePlannerItineraryMapData, type RoutePlannerLocation, type RoutePlannerLocationSearchTarget, type RoutePlannerPlanViewMode, type RoutePlannerTravelTime, type RoutePlannerTravelTimeMode, type RoutePlannerViewMode } from '@/types/route-planner/models';
import { buildRoutePlannerItineraryMapData } from '@/utils/route-planner/itinerary/geometry';
import { createRoutePlannerCurrentLocation } from '@/utils/route-planner/planning/locations';
import { fetchMotisPlan, getMotisItineraries } from '@/utils/route-planner/planning/motis-plan-api';
import { getRoutePlannerPlanStartTransition, getRoutePlannerStartTripTransition, getRoutePlannerTravelTimeModeTransition } from '@/utils/route-planner/planning/navigation';
import { clearLastSearchQuery } from '@/utils/search/search-query';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSWRMutation from 'swr/mutation';

/* * */

export type { RoutePlannerLocationSearchTarget, RoutePlannerViewMode } from '@/types/route-planner/models';

interface RoutePlannerContextState {
	actions: {
		clearRoute: () => void
		dismissTripSheets: () => void
		endActiveTrip: () => void
		openActiveTripDetail: () => void
		openDestinationSearch: () => void
		openDirectionsTo: (location: RoutePlannerLocation) => Promise<void>
		openFullInput: () => void
		openLocationSearch: (target: RoutePlannerLocationSearchTarget) => void
		openPlace: (location: RoutePlannerLocation) => Promise<void>
		openPlaceDetail: () => void
		openResults: () => void
		planRoute: (nextOrigin?: null | RoutePlannerLocation, nextDestination?: null | RoutePlannerLocation, nextTravelTime?: RoutePlannerTravelTime, nextViewMode?: RoutePlannerPlanViewMode) => Promise<void>
		selectDestination: (location: RoutePlannerLocation) => Promise<void>
		selectItinerary: (index: number) => void
		selectOrigin: (location: RoutePlannerLocation) => Promise<void>
		setDestination: (location: null | RoutePlannerLocation) => void
		setOrigin: (location: null | RoutePlannerLocation) => void
		setTravelTime: (date: Date) => void
		setTravelTimeMode: (mode: RoutePlannerTravelTimeMode) => void
		startItinerary: (index: number) => void
		swapLocations: () => void
	}
	data: {
		destination: null | RoutePlannerLocation
		itineraries: MotisItinerary[]
		location_search_target: RoutePlannerLocationSearchTarget
		origin: null | RoutePlannerLocation
		plan: MotisPlanResponse | null
		plan_error: null | string
		route_map_data: RoutePlannerItineraryMapData
		selected_itinerary: MotisItinerary | null
		selected_itinerary_index: null | number
		travel_time: RoutePlannerTravelTime
		view_mode: RoutePlannerViewMode
		was_opened_from_place: boolean
	}
	flags: {
		has_plan_error: boolean
		is_navigating: boolean
		is_planning: boolean
	}
}

/* * */

interface RoutePlanRequest {
	destination: RoutePlannerLocation
	errorMessage: string
	origin: RoutePlannerLocation
	travelTime: RoutePlannerTravelTime
}

/* * */

const ROUTE_PLAN_KEY = 'route-planner/plan';

async function fetchRoutePlan(_key: string, { arg }: { arg: RoutePlanRequest }) {
	return fetchMotisPlan(arg.origin, arg.destination, arg.travelTime, arg.errorMessage);
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
	const { clearActiveBottomSheets, setActiveBottomSheet } = useBottomSheet();
	const { data: lines } = useLinesData();
	const { actions: { requestCurrentLocation }, data: { location: userLocation } } = useUserLocation();

	const [destination, setDestinationState] = useState<null | RoutePlannerLocation>(null);
	const [origin, setOriginState] = useState<null | RoutePlannerLocation>(null);
	const [plan, setPlan] = useState<MotisPlanResponse | null>(null);
	const [planError, setPlanError] = useState<null | string>(null);
	const [selectedItineraryIndex, setSelectedItineraryIndex] = useState<null | number>(0);
	const [travelTime, setTravelTimeState] = useState<RoutePlannerTravelTime>(() => ({ date: new Date(), mode: 'now' }));
	const [viewMode, setViewMode] = useState<RoutePlannerViewMode>('destination-search');
	const [locationSearchTarget, setLocationSearchTarget] = useState<RoutePlannerLocationSearchTarget>('destination');
	const [wasOpenedFromPlace, setWasOpenedFromPlace] = useState(false);
	const [isNavigating, setIsNavigating] = useState(false);
	const { isMutating: isPlanning, reset: resetPlanRequest, trigger: triggerPlanRequest } = useSWRMutation<MotisPlanResponse, Error, string, RoutePlanRequest>(ROUTE_PLAN_KEY, fetchRoutePlan, { throwOnError: false });

	//
	// B. Transform data

	const itineraries = useMemo(() => getMotisItineraries(plan), [plan]);
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

	const buildOriginFromCoordinates = useCallback((latitude: number | undefined, longitude: number | undefined): null | RoutePlannerLocation => {
		return createRoutePlannerCurrentLocation({
			detail: t('default:routes.RoutePlannerSearch.origin.current_location_detail'),
			label: t('default:routes.RoutePlannerSearch.origin.current_location'),
			latitude,
			longitude,
		});
	}, [t]);

	const buildUserLocationOrigin = useCallback((): null | RoutePlannerLocation => {
		if (!userLocation) return null;
		return buildOriginFromCoordinates(userLocation.latitude, userLocation.longitude);
	}, [buildOriginFromCoordinates, userLocation]);

	const getCurrentUserLocationOrigin = useCallback(async (): Promise<null | RoutePlannerLocation> => {
		const location = await requestCurrentLocation();
		if (!location) return null;
		return buildOriginFromCoordinates(location.latitude, location.longitude);
	}, [buildOriginFromCoordinates, requestCurrentLocation]);

	const clearRoute = useCallback(() => {
		resetPlanRequest();
		setOriginState(null);
		setDestinationState(null);
		setPlan(null);
		setPlanError(null);
		setSelectedItineraryIndex(0);
		setViewMode('destination-search');
		setWasOpenedFromPlace(false);
		setIsNavigating(false);
	}, [resetPlanRequest]);

	const planRoute = useCallback(async (nextOrigin?: null | RoutePlannerLocation, nextDestination?: null | RoutePlannerLocation, nextTravelTime?: RoutePlannerTravelTime, nextViewMode: RoutePlannerPlanViewMode = 'results') => {
		const requestOrigin = nextOrigin === undefined ? origin : nextOrigin;
		const requestDestination = nextDestination === undefined ? destination : nextDestination;
		const requestTravelTime = nextTravelTime ?? travelTime;

		if (!requestOrigin || !requestDestination) {
			resetPlanRequest();
			setPlanError(t('default:routes.RoutePlanner.errors.missing_locations'));
			return;
		}

		const transition = getRoutePlannerPlanStartTransition(nextViewMode);

		setPlan(null);
		setPlanError(null);
		setIsNavigating(transition.isNavigating);
		setSelectedItineraryIndex(transition.selectedItineraryIndex);
		setViewMode(transition.viewMode);

		await triggerPlanRequest(
			{
				destination: requestDestination,
				errorMessage: t('default:routes.RoutePlanner.errors.unknown'),
				origin: requestOrigin,
				travelTime: requestTravelTime,
			},
			{
				onError: (caughtError) => {
					setPlanError(caughtError.message || t('default:routes.RoutePlanner.errors.unknown'));
					setViewMode(nextViewMode);
				},
				onSuccess: (data) => {
					setPlan(data);

					if (getMotisItineraries(data).length === 0) {
						setPlanError(t('default:routes.RoutePlanner.errors.no_itineraries'));
					}
				},
				throwOnError: false,
			},
		);
	}, [destination, origin, resetPlanRequest, t, travelTime, triggerPlanRequest]);

	const startItinerary = useCallback((index: number) => {
		const transition = getRoutePlannerStartTripTransition(index);

		setSelectedItineraryIndex(transition.selectedItineraryIndex);
		setIsNavigating(transition.isNavigating);
		setViewMode(transition.viewMode);
		clearActiveBottomSheets();
	}, [clearActiveBottomSheets]);

	const endActiveTrip = useCallback(() => {
		clearRoute();
		clearLastSearchQuery();
		clearActiveBottomSheets();
	}, [clearActiveBottomSheets, clearRoute]);

	const dismissTripSheets = useCallback(() => {
		clearActiveBottomSheets();
	}, [clearActiveBottomSheets]);

	const openActiveTripDetail = useCallback(() => {
		setViewMode('itinerary-detail');
		setActiveBottomSheet({ view: 'routes' }, { replace: true });
	}, [setActiveBottomSheet]);

	const openLocationSearch = useCallback((target: RoutePlannerLocationSearchTarget) => {
		setLocationSearchTarget(target);
		setViewMode('destination-search');
		setActiveBottomSheet({ view: 'routes' }, { replace: true });
	}, [setActiveBottomSheet]);

	const openDestinationSearch = useCallback(() => {
		openLocationSearch('destination');
	}, [openLocationSearch]);

	const openFullInput = useCallback(() => {
		setViewMode('full-input');
		setPlanError(null);
		setWasOpenedFromPlace(false);
		setActiveBottomSheet({ view: 'routes' }, { replace: true });
	}, [setActiveBottomSheet]);

	const openResults = useCallback(() => {
		setIsNavigating(false);
		setViewMode('results');
	}, []);

	const openPlace = useCallback(async (location: RoutePlannerLocation) => {
		resetPlanRequest();
		setDestinationState(location);
		setPlan(null);
		setPlanError(null);
		setSelectedItineraryIndex(null);
		setViewMode('place-detail');
		setWasOpenedFromPlace(true);
		setActiveBottomSheet({ view: 'routes' });

		const nextOrigin = origin || buildUserLocationOrigin() || await getCurrentUserLocationOrigin();
		if (!nextOrigin) {
			setPlanError(t('default:routes.RoutePlanner.errors.location_unavailable'));
			setViewMode('full-input');
			return;
		}

		setOriginState(nextOrigin);
		await planRoute(nextOrigin, location, undefined, 'place-detail');
	}, [buildUserLocationOrigin, getCurrentUserLocationOrigin, origin, planRoute, resetPlanRequest, setActiveBottomSheet, t]);

	const openPlaceDetail = useCallback(() => {
		setSelectedItineraryIndex(null);
		setViewMode('place-detail');
	}, []);

	const selectDestination = useCallback(async (location: RoutePlannerLocation) => {
		resetPlanRequest();
		setDestinationState(location);
		setPlan(null);
		setPlanError(null);
		setSelectedItineraryIndex(0);
		setWasOpenedFromPlace(false);

		const nextOrigin = origin || buildUserLocationOrigin() || await getCurrentUserLocationOrigin();
		if (!nextOrigin) {
			setPlanError(t('default:routes.RoutePlanner.errors.location_unavailable'));
			setViewMode('full-input');
			return;
		}

		setOriginState(nextOrigin);
		await planRoute(nextOrigin, location);
	}, [buildUserLocationOrigin, getCurrentUserLocationOrigin, origin, planRoute, resetPlanRequest, t]);

	const openDirectionsTo = useCallback(async (location: RoutePlannerLocation) => {
		setViewMode('results');
		setActiveBottomSheet({ view: 'routes' });
		await selectDestination(location);
	}, [selectDestination, setActiveBottomSheet]);

	const selectOrigin = useCallback(async (location: RoutePlannerLocation) => {
		resetPlanRequest();
		setOriginState(location);
		setPlan(null);
		setPlanError(null);
		setSelectedItineraryIndex(0);

		if (!destination) {
			setViewMode('full-input');
			return;
		}

		await planRoute(location, destination);
	}, [destination, planRoute, resetPlanRequest]);

	const selectItinerary = useCallback((index: number) => {
		setSelectedItineraryIndex(index);
		if (viewMode === 'place-detail') setViewMode('results');
	}, [viewMode]);

	const setDestination = useCallback((location: null | RoutePlannerLocation) => {
		resetPlanRequest();
		setDestinationState(location);
		setPlan(null);
		setPlanError(null);
		setSelectedItineraryIndex(0);
	}, [resetPlanRequest]);

	const setOrigin = useCallback((location: null | RoutePlannerLocation) => {
		resetPlanRequest();
		setOriginState(location);
		setPlan(null);
		setPlanError(null);
		setSelectedItineraryIndex(0);
	}, [resetPlanRequest]);

	const setTravelTime = useCallback((date: Date) => {
		resetPlanRequest();
		setTravelTimeState(current => ({ ...current, date }));
		setPlan(null);
		setPlanError(null);
		setSelectedItineraryIndex(0);
	}, [resetPlanRequest]);

	const setTravelTimeMode = useCallback((mode: RoutePlannerTravelTimeMode) => {
		resetPlanRequest();
		setTravelTimeState(current => getRoutePlannerTravelTimeModeTransition(current, mode));
		setPlan(null);
		setPlanError(null);
		setSelectedItineraryIndex(0);
	}, [resetPlanRequest]);

	const swapLocations = useCallback(() => {
		resetPlanRequest();
		setOriginState(destination);
		setDestinationState(origin);
		setPlan(null);
		setPlanError(null);
		setSelectedItineraryIndex(0);

		if (origin && destination) {
			void planRoute(destination, origin);
		}
	}, [destination, origin, planRoute, resetPlanRequest]);

	useEffect(() => {
		return () => resetPlanRequest();
	}, [resetPlanRequest]);

	//
	// D. Define context value

	const contextValue = useMemo<RoutePlannerContextState>(() => ({
		actions: {
			clearRoute,
			dismissTripSheets,
			endActiveTrip,
			openActiveTripDetail,
			openDestinationSearch,
			openDirectionsTo,
			openFullInput,
			openLocationSearch,
			openPlace,
			openPlaceDetail,
			openResults,
			planRoute,
			selectDestination,
			selectItinerary,
			selectOrigin,
			setDestination,
			setOrigin,
			setTravelTime,
			setTravelTimeMode,
			startItinerary,
			swapLocations,
		},
		data: {
			destination,
			itineraries,
			location_search_target: locationSearchTarget,
			origin,
			plan,
			plan_error: planError,
			route_map_data: routeMapData,
			selected_itinerary: selectedItinerary,
			selected_itinerary_index: selectedItineraryIndex,
			travel_time: travelTime,
			view_mode: viewMode,
			was_opened_from_place: wasOpenedFromPlace,
		},
		flags: {
			has_plan_error: !!planError,
			is_navigating: isNavigating,
			is_planning: isPlanning,
		},
	}), [clearRoute, destination, dismissTripSheets, endActiveTrip, isNavigating, isPlanning, itineraries, locationSearchTarget, openActiveTripDetail, openDestinationSearch, openDirectionsTo, openFullInput, openLocationSearch, openPlace, openPlaceDetail, openResults, origin, plan, planError, planRoute, routeMapData, selectDestination, selectedItinerary, selectedItineraryIndex, selectItinerary, selectOrigin, setDestination, setOrigin, setTravelTime, setTravelTimeMode, startItinerary, swapLocations, travelTime, viewMode, wasOpenedFromPlace]);

	//
	// E. Render components

	return (
		<RoutePlannerContext.Provider value={contextValue}>
			{children}
		</RoutePlannerContext.Provider>
	);

	//
}
