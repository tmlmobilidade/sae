'use client';

import { getBaseGeoJsonFeatureCollection } from '@tmlmobilidade/geo';
import { Layer, Source } from '@vis.gl/react-maplibre';
import { useEffect, useRef, useState } from 'react';

/* * */

export const MapViewOverlayVehiclesPrimaryLayerId = 'default-layer-vehicles-regular';
export const MapViewOverlayVehiclesInteractiveLayerId = 'default-layer-vehicles-regular';

/* * */

interface MapViewOverlayVehiclesProps {
	presentBeforeId?: string
	vehiclesData?: GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>
	visible?: boolean
}

/* * */

const baseGeoJsonFeatureCollection = getBaseGeoJsonFeatureCollection();

const ANIMATION_DURATION = 5_000; // ms

function ease(t: number): number {
	return t; // t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function interpolateCoords(start: number[], end: number[], t: number): number[] {
	return [
		start[0] + (end[0] - start[0]) * t,
		start[1] + (end[1] - start[1]) * t,
	];
}

function interpolateAngle(start: number, end: number, t: number): number {
	const delta = ((((end - start) % 360) + 540) % 360) - 180;
	return start + delta * t;
}

function parseBearing(value: unknown): null | number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return null;
}

function getDeterministicBearing(feature: GeoJSON.Feature<GeoJSON.Point>): number {
	const idPart = feature.id != null ? String(feature.id) : '';
	const [lng, lat] = feature.geometry.coordinates;
	const seed = `${idPart}:${lng.toFixed(6)}:${lat.toFixed(6)}`;

	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = ((hash << 5) - hash) + seed.charCodeAt(i);
		hash |= 0;
	}

	return ((hash % 360) + 360) % 360;
}

function interpolateProps(startFeature: GeoJSON.Feature<GeoJSON.Point> | undefined, endFeature: GeoJSON.Feature<GeoJSON.Point>, t: number): GeoJSON.Feature {
	const endCoords = endFeature.geometry.coordinates;

	const startCoords = startFeature
		? (startFeature.geometry as GeoJSON.Point).coordinates
		: endCoords;

	const interpolatedCoords = interpolateCoords(startCoords, endCoords, t);

	const startBearingValue = parseBearing(startFeature?.properties?.bearing);
	const endBearingValue = parseBearing(endFeature.properties?.bearing);
	const fallbackBearing = getDeterministicBearing(endFeature);

	const startBearing = startBearingValue ?? endBearingValue ?? fallbackBearing;
	const endBearing = endBearingValue ?? startBearingValue ?? fallbackBearing;
	const interpolatedBearing = interpolateAngle(startBearing, endBearing, t);

	const endDelay = endFeature.properties?.delay ?? 0;
	const startDelay = startFeature?.properties?.delay ?? endDelay;
	const interpolatedDelay = startDelay + (endDelay - startDelay) * t;

	// Fade in new features
	const interpolatedOpacity = startFeature ? 1 : t;

	return {
		...endFeature,
		geometry: {
			...endFeature.geometry,
			coordinates: interpolatedCoords,
		},
		properties: {
			...endFeature.properties,
			bearing: interpolatedBearing,
			delay: interpolatedDelay,
			opacity: interpolatedOpacity,
		},
	};
}

/* * */

export function MapViewOverlayVehicles({ presentBeforeId, vehiclesData = baseGeoJsonFeatureCollection, visible = true }: MapViewOverlayVehiclesProps) {
	//

	//
	// A. Setup variables

	const [animatedData, setAnimatedData] = useState(vehiclesData);
	const previousDataRef = useRef<GeoJSON.FeatureCollection>(vehiclesData);
	const animationStart = useRef<null | number>(null);
	const animationFrame = useRef<null | number>(null);

	//
	// B. Transform data

	useEffect(() => {
		if (!vehiclesData || vehiclesData.features.length === 0) {
			setAnimatedData(vehiclesData);
			previousDataRef.current = vehiclesData;
			return;
		}

		const startMap = new Map<number | string, GeoJSON.Feature>();
		for (const f of previousDataRef.current.features) {
			if (f.id != null) startMap.set(f.id, f);
		}

		const animate = (timestamp: number) => {
			if (!animationStart.current) animationStart.current = timestamp;
			const elapsed = timestamp - animationStart.current;
			const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
			const easedProgress = ease(progress);

			const interpolatedFeatures = vehiclesData.features.map((endFeature) => {
				const id = endFeature.id;
				const startFeature = id != null ? startMap.get(id) as GeoJSON.Feature<GeoJSON.Point> : undefined;
				return interpolateProps(startFeature, endFeature as GeoJSON.Feature<GeoJSON.Point>, easedProgress);
			});

			setAnimatedData({
				...vehiclesData,
				features: interpolatedFeatures as GeoJSON.Feature<GeoJSON.Point>[],
			});

			if (progress < 1) {
				animationFrame.current = requestAnimationFrame(animate);
			} else {
				previousDataRef.current = vehiclesData;
				animationStart.current = null;
			}
		};

		if (animationFrame.current !== null) {
			cancelAnimationFrame(animationFrame.current);
		}
		animationFrame.current = requestAnimationFrame(animate);

		return () => {
			if (animationFrame.current !== null) {
				cancelAnimationFrame(animationFrame.current);
			}
		};
	}, [vehiclesData]);

	//
	// B. Render components

	return (
		<Source data={animatedData} generateId={true} id="default-source-vehicles" type="geojson">

			<Layer
				beforeId={presentBeforeId}
				id="default-layer-vehicles-regular"
				source="default-source-vehicles"
				type="symbol"
				layout={{
					'icon-allow-overlap': true,
					'icon-anchor': 'center',
					'icon-ignore-placement': true,
					'icon-image': [
						'match',
						['to-string', ['get', 'agency_id']],
						'IA9T6', 'map-vehicle-ccfl-bus',
						'IA2N9', 'map-vehicle-ml-train',
						'N18KL', 'map-vehicle-cp-train',
						'LTP61', 'map-vehicle-ttsl-boat',
						'A3H3M', 'map-vehicle-tcb-bus',
						'7NTB1', 'map-vehicle-fertagus-train',
						'KB1F6', 'map-vehicle-mts-tram',
						'HF16N', 'map-vehicle-mobi-bus',
						'LA77N', 'map-vehicle-cmet-bus',
						'BNA17', 'map-vehicle-cmet-bus',
						'YA15B', 'map-vehicle-cmet-bus',
						'A2L1N', 'map-vehicle-cmet-bus',
						'map-vehicle-cmet-bus',
					],
					'icon-offset': [0, 0],
					'icon-rotate': ['get', 'bearing'],
					'icon-rotation-alignment': 'map',
					'icon-size': [
						'interpolate',
						['linear'],
						['zoom'],
						10,
						0.05,
						30,
						0.5,
					],
					'symbol-placement': 'point',
					'visibility': visible ? 'visible' : 'none',

				}}
				paint={{
					'icon-opacity': [
						'interpolate',
						['linear'],
						['zoom'],
						12,
						0,
						13,
						1,
					],
				}}
			/>

			<Layer
				beforeId="default-layer-vehicles-regular"
				id="default-layer-vehicles-dot"
				source="default-source-vehicles"
				type="circle"
				layout={{
					visibility: visible ? 'visible' : 'none',
				}}
				paint={{
					'circle-color': '#00CD32',
					'circle-opacity': [
						'interpolate',
						['linear'],
						['zoom'],
						12,
						1,
						13,
						0,
					],
					'circle-pitch-alignment': 'map',
					'circle-radius': 1.8,
				}}
			/>

		</Source>
	);
}
