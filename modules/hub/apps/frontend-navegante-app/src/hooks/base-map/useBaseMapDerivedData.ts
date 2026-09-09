'use client';

import { useAlertsMapData } from '@/components/alerts/use-alerts-map-data';
import { useLinesDetailContext } from '@/components/lines/detail/LinesDetail.context';
import { useVehiclesMapData } from '@/components/vehicles/use-vehicles-map-data';
import { useRoutePlannerMapData } from '@/hooks/base-map/useRoutePlannerMapData';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';
import { type BaseMapOperatorId } from '@/lib/agency-catalog';
import { getBaseMapAlertsMapData, getBaseMapVehiclesMapData } from '@/utils/map/base-map-data';
import { useMemo } from 'react';

/* * */

interface UseBaseMapDerivedDataParams {
	activeBottomSheet: ReturnType<typeof useBottomSheet>['activeBottomSheet']
	excludedOperatorIds: BaseMapOperatorId[]
	focusedAlertId: null | string
	focusedVehicleId: null | string
}

/* * */

export function useBaseMapDerivedData(params: UseBaseMapDerivedDataParams) {
	//

	//
	// A. Setup variables

	const { data: alertsFeatureCollection, entities: alerts } = useAlertsMapData();
	const linesDetailContext = useLinesDetailContext();
	const { data: vehiclesFeatureCollection } = useVehiclesMapData();
	const routePlannerMapData = useRoutePlannerMapData({
		activeBottomSheet: params.activeBottomSheet,
		alerts,
		alertsFeatureCollection,
	});

	//
	// B. Transform data

	const lineDetailVehicleShapeIds = useMemo(() => {
		if (params.activeBottomSheet?.view !== 'lines-detail') return null;
		const activeShapeId = linesDetailContext.data.active_pattern?.shape_id;
		return new Set(activeShapeId ? [activeShapeId] : []);
	}, [params.activeBottomSheet?.view, linesDetailContext.data.active_pattern?.shape_id]);

	const alertsMapData = useMemo(() => {
		return getBaseMapAlertsMapData({
			alerts,
			alertsData: alertsFeatureCollection,
			excludedOperatorIds: params.excludedOperatorIds,
			focusedAlertId: params.focusedAlertId,
			routePlannerAlertsData: routePlannerMapData.alertsMapData,
		});
	}, [alerts, alertsFeatureCollection, params.excludedOperatorIds, params.focusedAlertId, routePlannerMapData.alertsMapData]);

	const vehiclesMapData = useMemo(() => {
		return getBaseMapVehiclesMapData({
			excludedOperatorIds: params.excludedOperatorIds,
			focusedVehicleId: params.focusedVehicleId,
			lineDetailShapeIds: lineDetailVehicleShapeIds,
			routePlannerRouteDirections: routePlannerMapData.vehicleRouteDirections,
			vehiclesData: vehiclesFeatureCollection,
		});
	}, [lineDetailVehicleShapeIds, params.excludedOperatorIds, params.focusedVehicleId, routePlannerMapData.vehicleRouteDirections, vehiclesFeatureCollection]);

	const shouldAlwaysShowFilteredVehicles = routePlannerMapData.vehicleRouteDirections !== null || lineDetailVehicleShapeIds !== null;

	//
	// C. Return data

	return {
		alertsMapData,
		placeDestination: routePlannerMapData.placeDestination,
		routePlannerContextShapeData: routePlannerMapData.contextShapeData,
		routePlannerMapFitFeatures: routePlannerMapData.fitFeatures,
		shouldAlwaysShowFilteredVehicles,
		vehiclesMapData,
	};

	//
}
