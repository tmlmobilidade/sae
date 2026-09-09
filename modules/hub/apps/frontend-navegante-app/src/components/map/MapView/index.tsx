'use client';

import { mapDefaultConfig } from '@/constants/map';
import { useMapContext } from '@/contexts/Map.context';
import { useColorScheme } from '@tmlmobilidade/ui';
import { loadMapAssets, MAP_ASSETS_ALERTS, MAP_ASSETS_MISC, MAP_ASSETS_SHAPES, MAP_ASSETS_STOPS, MAP_ASSETS_VEHICLES } from '@tmlmobilidade/ui';
import Map, { type MapLayerMouseEvent, type MapLayerTouchEvent, MapRef, useMap } from '@vis.gl/react-maplibre';
import { type MapLibreEvent } from 'maplibre-gl';
import { useCallback, useEffect, useState } from 'react';

import styles from './styles.module.css';

/* * */

interface MapViewProps {
	autoZoom?: boolean
	children: React.ReactNode
	id?: string
	interactiveLayerIds?: string[]
	mapObject?: MapRef
	onCenterMap?: () => void
	onClick?: (arg0) => void
	onDrag?: (arg0) => void
	onMouseDown?: (event: MapLayerMouseEvent) => void
	onMouseEnter?: (arg0) => void // When the mouse enters the interactive layer
	onMouseLeave?: (arg0) => void // When the mouse leaves the interactive layer
	onMouseMove?: (event: MapLayerMouseEvent) => void
	onMouseOut?: (arg0) => void // When the mouse enters the map
	onMouseOver?: (arg0) => void // When the mouse leaves the map
	onMouseUp?: (event: MapLayerMouseEvent) => void
	onMove?: (arg0) => void
	onMoveEnd?: (arg0) => void
	onMoveStart?: (arg0) => void
	onTouchCancel?: (event: MapLayerTouchEvent) => void
	onTouchEnd?: (event: MapLayerTouchEvent) => void
	onTouchMove?: (event: MapLayerTouchEvent) => void
	onTouchStart?: (event: MapLayerTouchEvent) => void
	onZoom?: (arg0) => void
	primarySourceId?: string
	scrollZoom?: boolean
	showCenterButton?: boolean
	toolbarExtras?: React.ReactNode
}

/* * */

export function MapView({ children, id, interactiveLayerIds = [], onClick, onDrag, onMouseDown, onMouseEnter, onMouseLeave, onMouseMove, onMouseOut, onMouseOver, onMouseUp, onMoveEnd, onMoveStart, onTouchCancel, onTouchEnd, onTouchMove, onTouchStart, onZoom, scrollZoom = true }: MapViewProps) {
	//

	//
	// A. Setup variables

	const allMaps = useMap();
	const colorScheme = useColorScheme();

	const mapContext = useMapContext();
	const mapStyle = colorScheme === 'dark' ? mapDefaultConfig.styles.dark : mapDefaultConfig.styles.light;

	const [cursor, setCursor] = useState<string>('auto');
	const [areMapAssetsLoaded, setAreMapAssetsLoaded] = useState(false);

	//
	// B. Transform data

	useEffect(() => {
		if (!id || !allMaps?.[id]) return;
		mapContext.actions.setMap(allMaps[id]);
	}, [allMaps, id, mapContext.actions]);

	useEffect(() => {
		setAreMapAssetsLoaded(false);
	}, [mapStyle]);

	//
	// C. Handle actions

	const handleOnLoad = async (event: MapLibreEvent) => {
		await Promise.all([
			loadMapAssets(event.target, MAP_ASSETS_ALERTS),
			loadMapAssets(event.target, MAP_ASSETS_MISC),
			loadMapAssets(event.target, MAP_ASSETS_SHAPES),
			loadMapAssets(event.target, MAP_ASSETS_STOPS),
			loadMapAssets(event.target, MAP_ASSETS_VEHICLES),
		]);
		setAreMapAssetsLoaded(true);
	};

	const handleOnStyleData = async (event: MapLibreEvent) => {
		if (!event.target.isStyleLoaded()) return;
		await handleOnLoad(event);
	};

	const handleOnMouseEnter = useCallback((event) => {
		setCursor('pointer');
		if (onMouseEnter) onMouseEnter(event);
	}, [onMouseEnter]);

	const handleOnMouseLeave = useCallback((event) => {
		setCursor('auto');
		if (onMouseLeave) onMouseLeave(event);
	}, [onMouseLeave]);

	const handleOnMoveStart = useCallback((event) => {
		setCursor('grab');
		if (onMoveStart) onMoveStart(event);
	}, [onMoveStart]);

	const handleOnMoveEnd = useCallback((event) => {
		setCursor('auto');
		if (onMoveEnd) onMoveEnd(event);
	}, [onMoveEnd]);

	//
	// D. Render components

	return (
		<div className={styles.container}>

			<Map
				attributionControl={false}
				cursor={cursor}
				id={id || 'map'}
				initialViewState={mapDefaultConfig.initialViewState}
				interactive={interactiveLayerIds ? true : false}
				interactiveLayerIds={interactiveLayerIds}
				mapStyle={mapStyle}
				maxPitch={0}
				maxZoom={mapDefaultConfig.maxZoom}
				minPitch={0}
				minZoom={mapDefaultConfig.minZoom}
				onClick={onClick}
				onDrag={onDrag}
				onLoad={handleOnLoad}
				onMouseDown={onMouseDown}
				onMouseEnter={handleOnMouseEnter}
				onMouseLeave={handleOnMouseLeave}
				onMouseMove={onMouseMove}
				onMouseOut={onMouseOut}
				onMouseOver={onMouseOver}
				onMouseUp={onMouseUp}
				onMove={handleOnMoveStart}
				onMoveEnd={handleOnMoveEnd}
				onMoveStart={handleOnMoveStart}
				onStyleData={handleOnStyleData}
				onTouchCancel={onTouchCancel}
				onTouchEnd={onTouchEnd}
				onTouchMove={onTouchMove}
				onTouchStart={onTouchStart}
				onZoom={onZoom}
				scrollZoom={scrollZoom}
				style={{ height: '100%', width: '100%' }}
			>

				<div className={styles.childrenWrapper}>
					{areMapAssetsLoaded && children}
				</div>

			</Map>

			<div className={styles.attributionWrapper}>
				<a href="https://maplibre.org/" target="_blank">MapLibre</a>
				<a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a>
				<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>
			</div>

		</div>
	);
}
