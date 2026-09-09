'use client';

import { useUserLocation } from '@/contexts/UserLocation.context';
import { type BaseMapOperatorId, type BaseMapOverlayType } from '@/types/common/map';
import { useSessionStorage } from '@tmlmobilidade/ui';
import { moveMapView } from '@tmlmobilidade/ui';
import { type MapRef } from '@vis.gl/react-maplibre';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/* * */

interface MapContextState {
	actions: {
		moveMap: (params: { isUserInitiated: boolean, latitude: number, longitude: number }) => void
		setMap: (map: MapRef) => void
		toggleBaseMapOperator: (operatorId: BaseMapOperatorId) => void
		toggleBaseMapOverlay: (overlay: BaseMapOverlayType) => void
	}
	data: {
		activeBaseMapOverlays: BaseMapOverlayType[]
		excludedBaseMapOperatorIds: BaseMapOperatorId[]
		map: MapRef | undefined
	}
}

/* * */

const MapContext = createContext<MapContextState | undefined>(undefined);

export function useMapContext() {
	const context = useContext(MapContext);
	if (!context) {
		throw new Error('useMapContext must be used within a MapContextProvider');
	}
	return context;
}

/* * */

export function MapContextProvider({ children }: PropsWithChildren) {
	//

	//
	// A. Setup variables

	const [dataMapState, setDataMapState] = useState<MapContextState['data']['map']>(undefined);

	const { data: { location: userLocation, tracking_mode: userLocationTrackingMode } } = useUserLocation();

	const [activeBaseMapOverlays, setActiveBaseMapOverlays] = useSessionStorage<BaseMapOverlayType[]>({
		defaultValue: ['alerts', 'vehicles'],
		key: 'active-viewport-map-sources',
	});
	const [excludedBaseMapOperatorIds, setExcludedBaseMapOperatorIds] = useSessionStorage<BaseMapOperatorId[]>({
		defaultValue: [],
		key: 'excluded-viewport-map-operators',
	});

	//
	// B. Handle actions

	const setMap = useCallback((map: MapRef) => {
		setDataMapState(map);
	}, []);

	const moveMap = useCallback((params: { isUserInitiated: boolean, latitude: number, longitude: number }) => {
		if (params.isUserInitiated) dataMapState?.stop();
		moveMapView(dataMapState, [params.longitude, params.latitude], { zoom: 15 });
	}, [dataMapState]);

	const toggleBaseMapOverlay = useCallback((source: BaseMapOverlayType) => {
		setActiveBaseMapOverlays((prev) => {
			// Create a new set with the previous sources
			const result = new Set([...prev]);
			// Toggle the source
			if (result.has(source)) result.delete(source);
			else result.add(source);
			// Return the new sources as an array
			return Array.from(result);
		});
	}, [setActiveBaseMapOverlays]);

	const toggleBaseMapOperator = useCallback((operatorId: BaseMapOperatorId) => {
		setExcludedBaseMapOperatorIds((previousOperatorIds) => {
			const nextOperatorIds = new Set(previousOperatorIds);

			if (nextOperatorIds.has(operatorId)) nextOperatorIds.delete(operatorId);
			else nextOperatorIds.add(operatorId);

			return Array.from(nextOperatorIds);
		});
	}, [setExcludedBaseMapOperatorIds]);

	useEffect(() => {
		// Skip if the user location tracking mode is idle
		if (userLocationTrackingMode === 'idle') return;
		// Skip if the user location is not available
		if (!Number.isFinite(userLocation?.latitude) || !Number.isFinite(userLocation?.longitude)) return;
		// Get the coordinates and bearing
		const coordinates = [userLocation.longitude, userLocation.latitude];
		const bearing = userLocationTrackingMode === 'follow-bearing' ? userLocation.bearing ?? undefined : undefined;
		// Move the map view
		moveMapView(dataMapState, coordinates, { bearing, zoom: 15 });
	}, [dataMapState, userLocation, userLocationTrackingMode]);

	//
	// C. Define context value

	const contextValue = useMemo<MapContextState>(() => ({
		actions: {
			moveMap,
			setMap,
			toggleBaseMapOperator,
			toggleBaseMapOverlay,
		},
		data: {
			activeBaseMapOverlays,
			excludedBaseMapOperatorIds,
			map: dataMapState,
		},
	}), [activeBaseMapOverlays, dataMapState, excludedBaseMapOperatorIds, moveMap, setMap, toggleBaseMapOperator, toggleBaseMapOverlay]);

	//
	// D. Render components

	return (
		<MapContext.Provider value={contextValue}>
			{children}
		</MapContext.Provider>
	);
}
