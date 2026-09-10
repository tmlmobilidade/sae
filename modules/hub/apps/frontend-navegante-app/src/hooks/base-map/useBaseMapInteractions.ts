'use client';

import { MapViewOverlayStopsInteractiveLayerId, MapViewOverlayStopsVisibleMinZoom } from '@/components/map/MapViewOverlayStops';
import { MapViewOverlayVehiclesInteractiveLayerId, MapViewOverlayVehiclesPrimaryLayerId } from '@/components/map/MapViewOverlayVehicles';
import { MapViewStyleAlertsInteractiveLayerId } from '@/components/map/MapViewStyleAlerts';
import { useRoutePlannerContext } from '@/components/routes/RoutePlanner.context';
import { useUserLocation } from '@/contexts/UserLocation.context';
import { type MapLongPressLocation, useMapLongPress } from '@/hooks/base-map/useMapLongPress';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';
import { useMapBottomSheet } from '@/hooks/bottom-sheet/useMapBottomSheet';
import { type MapLayerMouseEvent, useMap, type ViewStateChangeEvent } from '@vis.gl/react-maplibre';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/* * */

export const baseMapInteractiveLayerIds = [
	MapViewOverlayVehiclesPrimaryLayerId,
	MapViewOverlayStopsInteractiveLayerId,
	MapViewStyleAlertsInteractiveLayerId,
];

interface UseBaseMapInteractionsParams {
	setUserLocationTrackingMode: ReturnType<typeof useUserLocation>['actions']['setTrackingMode']
}

/* * */

export function useBaseMapInteractions({ setUserLocationTrackingMode }: UseBaseMapInteractionsParams) {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();
	const routePlannerContext = useRoutePlannerContext();
	const { replaceActive } = useBottomSheet();
	const { collapseForMapInteraction } = useMapBottomSheet();
	const { 'base-map': baseMap } = useMap();
	const [selectedMapLocation, setSelectedMapLocation] = useState<MapLongPressLocation | null>(null);
	const mapLongPress = useMapLongPress(setSelectedMapLocation);

	//
	// B. Handle actions

	const handleMapClick = (event: MapLayerMouseEvent) => {
		if (mapLongPress.consumeTriggeredClick()) return;

		setSelectedMapLocation(null);
		if (!event.features?.length) return;

		const feature = event.features[0];
		const layerId = feature.layer?.id;

		if (layerId === MapViewOverlayStopsInteractiveLayerId) {
			if (!baseMap || baseMap.getZoom() <= MapViewOverlayStopsVisibleMinZoom) return;
			if (!feature.properties._id) return;
			replaceActive({ entityId: String(feature.properties._id), view: 'stops-detail' });
			return;
		}

		if (layerId === MapViewStyleAlertsInteractiveLayerId) {
			if (!feature.properties._id) return;
			replaceActive({ entityId: String(feature.properties._id), view: 'alerts-detail' });
			return;
		}

		if (layerId === MapViewOverlayVehiclesInteractiveLayerId) {
			if (!feature.properties.vehicle_id) return;
			replaceActive({ entityId: String(feature.properties.vehicle_id), view: 'vehicles-detail' });
		}
	};

	const handleGetDirections = () => {
		if (!selectedMapLocation) return;

		const location = selectedMapLocation;
		setSelectedMapLocation(null);
		void routePlannerContext.actions.openDirectionsTo({
			detail: `${location.latitude}, ${location.longitude}`,
			label: t('default:map.MapLocationPin.selected_location'),
			lat: location.latitude,
			lon: location.longitude,
			type: 'PLACE',
		});
	};

	const handleMapDrag = (event: ViewStateChangeEvent) => {
		mapLongPress.cancel();
		setUserLocationTrackingMode('idle');
		collapseForMapInteraction(event);
	};

	const handleMapZoom = (event: ViewStateChangeEvent) => {
		mapLongPress.cancel();
		collapseForMapInteraction(event);
	};

	//
	// C. Return data

	return {
		handleGetDirections,
		mapViewInteractionProps: {
			onClick: handleMapClick,
			onDrag: handleMapDrag,
			onMouseDown: mapLongPress.handlePressStart,
			onMouseLeave: mapLongPress.cancel,
			onMouseMove: mapLongPress.handlePressMove,
			onMouseUp: mapLongPress.cancel,
			onTouchCancel: mapLongPress.cancel,
			onTouchEnd: mapLongPress.cancel,
			onTouchMove: mapLongPress.handlePressMove,
			onTouchStart: mapLongPress.handlePressStart,
			onZoom: handleMapZoom,
		},
		selectedMapLocation,
	};

	//
}
