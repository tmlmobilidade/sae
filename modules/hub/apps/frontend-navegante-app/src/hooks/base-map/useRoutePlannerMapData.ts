'use client';

import { useLinesData } from '@/components/lines/use-lines-data';
import { useRoutesData } from '@/components/lines/use-routes-data';
import { useRoutePlannerContext } from '@/components/routes/RoutePlanner.context';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';
import { buildRoutePlannerAlertFeatureCollection, filterAlertsByRoutePlannerItinerary, getRoutePlannerItineraryAlertFilters } from '@/utils/route-planner/itinerary/alerts';
import { getRoutePlannerItineraryRouteDirections, getRoutePlannerItineraryRouteIds, getRoutePlannerRouteDirectionKey, getRoutePlannerRouteIdKey } from '@/utils/route-planner/itinerary/vehicles';
import { getRoutePlannerMapFitFeatures } from '@/utils/route-planner/planning/navigation';
import { fetchPatterns } from '@/utils/transit/fetch-patterns';
import { API_ROUTES } from '@tmlmobilidade/consts';
import { type HubAlert, type HubPattern, type HubShape } from '@tmlmobilidade/go-types-hub';
import { fetchApiData } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

interface UseRoutePlannerMapDataParams {
	activeBottomSheet: ReturnType<typeof useBottomSheet>['activeBottomSheet']
	alerts: HubAlert[]
	alertsFeatureCollection: GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>
}

/* * */

export function useRoutePlannerMapData({ activeBottomSheet, alerts: allAlerts, alertsFeatureCollection }: UseRoutePlannerMapDataParams) {
	//

	//
	// A. Setup variables

	const { data: lines } = useLinesData();
	const { data: routes } = useRoutesData();
	const routePlannerContext = useRoutePlannerContext();

	//
	// B. Fetch data

	const vehicleRouteDirections = useMemo(() => {
		return getRoutePlannerItineraryRouteDirections(routePlannerContext.data.selected_itinerary);
	}, [routePlannerContext.data.selected_itinerary]);

	const routeIds = useMemo(() => {
		return getRoutePlannerItineraryRouteIds(routePlannerContext.data.selected_itinerary);
	}, [routePlannerContext.data.selected_itinerary]);

	const patternIds = useMemo(() => {
		if (!routeIds) return [];

		return Array.from(new Set(
			routes
				.filter(route => routeIds.has(getRoutePlannerRouteIdKey(route._id, route.agency_id) || ''))
				.flatMap(route => route.pattern_ids),
		));
	}, [routeIds, routes]);

	const { data: patternGroups } = useSWR<HubPattern[][]>(
		patternIds.length > 0 ? ['route-planner-patterns', ...patternIds] : null,
		{ fetcher: () => fetchPatterns(patternIds) },
	);

	const patterns = useMemo(() => {
		if (!vehicleRouteDirections || !patternGroups) return [];

		const matchingPatterns = patternGroups
			.flat()
			.filter((candidate) => {
				const routeDirection = getRoutePlannerRouteDirectionKey(candidate.route_id, candidate.direction_id, candidate.agency_id);
				return routeDirection !== null && vehicleRouteDirections.has(routeDirection);
			});

		return Array.from(new Map(matchingPatterns.map(candidate => [candidate.shape_id, candidate])).values());
	}, [patternGroups, vehicleRouteDirections]);

	const shapeIds = useMemo(() => {
		return patterns.map(candidate => candidate.shape_id);
	}, [patterns]);

	const { data: shapes } = useSWR<HubShape[]>(
		shapeIds.length > 0 ? ['route-planner-shapes', ...shapeIds] : null,
		{ fetcher: async () => {
			const shapePayloads = await Promise.all(shapeIds.map(async (shapeId) => {
				const response = await fetchApiData<HubShape>({
					options: { credentials: 'omit' },
					url: API_ROUTES.hub.NETWORK_SHAPES(shapeId),
				});
				return response.data;
			}));

			return shapePayloads.filter((shape): shape is HubShape => shape !== null);
		} },
	);

	//
	// C. Transform data

	const alertFilters = useMemo(() => {
		return getRoutePlannerItineraryAlertFilters(routePlannerContext.data.selected_itinerary, lines);
	}, [lines, routePlannerContext.data.selected_itinerary]);

	const alerts = useMemo(() => {
		return filterAlertsByRoutePlannerItinerary(allAlerts, alertFilters);
	}, [alertFilters, allAlerts]);

	const alertsMapData = useMemo(() => {
		if (!alertFilters) return alertsFeatureCollection;
		return buildRoutePlannerAlertFeatureCollection(alertsFeatureCollection, alerts, routePlannerContext.data.route_map_data, lines);
	}, [alertFilters, alerts, alertsFeatureCollection, lines, routePlannerContext.data.route_map_data]);

	const contextShapeData = useMemo<GeoJSON.FeatureCollection<GeoJSON.LineString>>(() => {
		const shapesById = new Map(shapes?.map(candidate => [candidate._id, candidate]) ?? []);

		return {
			features: patterns.flatMap((pattern) => {
				const shape = shapesById.get(pattern.shape_id);
				if (!shape) return [];

				return [{
					...shape.geojson,
					properties: {
						...shape.geojson.properties,
						color: pattern.color,
						text_color: pattern.text_color,
					},
				}];
			}),
			type: 'FeatureCollection',
		};
	}, [patterns, shapes]);

	const fitFeatures = useMemo(() => {
		return getRoutePlannerMapFitFeatures(routePlannerContext.data.route_map_data.shapeData.features, routePlannerContext.data.view_mode);
	}, [routePlannerContext.data.route_map_data.shapeData.features, routePlannerContext.data.view_mode]);

	const placeDestination = activeBottomSheet?.view === 'routes' && routePlannerContext.data.view_mode === 'place-detail'
		? routePlannerContext.data.destination
		: null;

	//
	// D. Return data

	return {
		alertsMapData,
		contextShapeData,
		fitFeatures,
		placeDestination,
		vehicleRouteDirections,
	};

	//
}
