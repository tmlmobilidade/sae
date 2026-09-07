'use client';

import { useAlertsContext } from '@/components/alerts/Alerts.context';
import { useLinesDetailContext } from '@/components/lines/detail/LinesDetail.context';
import { useVehiclesContext } from '@/components/vehicles/Vehicles.context';
import { useRoutePlannerMapData } from '@/hooks/base-map/useRoutePlannerMapData';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';
import { type BaseMapOperatorId } from '@/types/common/map';
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

	const alertsContext = useAlertsContext();
	const linesDetailContext = useLinesDetailContext();
	const vehiclesContext = useVehiclesContext();
	const routePlannerMapData = useRoutePlannerMapData({ activeBottomSheet: params.activeBottomSheet });

	//
	// B. Transform data

	const lineDetailVehicleShapeIds = useMemo(() => {
		if (params.activeBottomSheet?.view !== 'lines-detail') return null;
		const activeShapeId = linesDetailContext.data.active_pattern?.shape_id;
		return new Set(activeShapeId ? [activeShapeId] : []);
	}, [params.activeBottomSheet?.view, linesDetailContext.data.active_pattern?.shape_id]);

	const alertsMapData = useMemo(() => {
		return getBaseMapAlertsMapData({
			alerts: alertsContext.data.alerts,
			alertsData: alertsContext.data.fc,
			excludedOperatorIds: params.excludedOperatorIds,
			focusedAlertId: params.focusedAlertId,
			routePlannerAlertsData: routePlannerMapData.alertsMapData,
		});
	}, [alertsContext.data.alerts, alertsContext.data.fc, params.excludedOperatorIds, params.focusedAlertId, routePlannerMapData.alertsMapData]);

	const vehiclesMapData = useMemo(() => {
		return getBaseMapVehiclesMapData({
			excludedOperatorIds: params.excludedOperatorIds,
			focusedVehicleId: params.focusedVehicleId,
			lineDetailShapeIds: lineDetailVehicleShapeIds,
			routePlannerRouteDirections: routePlannerMapData.vehicleRouteDirections,
			vehiclesData: vehiclesContext.data.fc,
		});
	}, [lineDetailVehicleShapeIds, params.excludedOperatorIds, params.focusedVehicleId, routePlannerMapData.vehicleRouteDirections, vehiclesContext.data.fc]);

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
