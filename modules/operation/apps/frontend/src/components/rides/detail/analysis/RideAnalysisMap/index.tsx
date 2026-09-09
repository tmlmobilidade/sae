'use client';

import { ReplayEvents } from '@/components/common/ReplayEvents';
import { getBaseGeoJsonFeature, getBaseGeoJsonFeatureCollection, getGeofenceOnPosition } from '@tmlmobilidade/geo';
import { type SimplifiedApexValidation } from '@tmlmobilidade/go-types-apex';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { fromEncodedPolylineToGeoJsonLineString } from '@tmlmobilidade/go-utils-geo';
import { Collapsible, Divider, getCssVariableValue, MapOverlayGeofences, type MapOverlayGeofencesPolygonDataProps, MapOverlayObservedPath, type MapOverlayObservedPathLineDataProps, type MapOverlayObservedPathPointsDataProps, MapOverlayScheduledPath, type MapOverlayScheduledPathLineDataProps, type MapOverlayScheduledPathPointsDataProps, MapView, Section, Switch } from '@tmlmobilidade/ui';
import { type FeatureCollection, type LineString, type Point, type Polygon } from 'geojson';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

import { useRidesDetailApexValidationsData } from '../../shared/use-rides-detail-apex-validations-data';
import { useRidesDetailHashedShapeData } from '../../shared/use-rides-detail-hashed-shape-data';
import { useRidesDetailHashedTripData } from '../../shared/use-rides-detail-hashed-trip-data';
import { useRidesDetailRideData } from '../../shared/use-rides-detail-ride-data';
import { useRidesDetailVehicleEventsData } from '../../shared/use-rides-detail-vehicle-events-data';

/* * */

export function RideAnalysisMap() {
	//

	//
	// A. Setup variables

	const { data: rideData } = useRidesDetailRideData();
	const { data: hashedTripData } = useRidesDetailHashedTripData();
	const { data: hashedShapeData } = useRidesDetailHashedShapeData();
	const { data: apexValidationsData } = useRidesDetailApexValidationsData();
	const { data: vehicleEventsData } = useRidesDetailVehicleEventsData();

	const [replayIndex, setReplayIndex] = useState(0);

	const showReplay = rideData?.operational_status === 'ended' && vehicleEventsData?.length > 0;

	const rideId = rideData?._id;
	const prevRideIdRef = useRef<string | undefined>(undefined);

	//
	// B. Transform data

	const observedEventsFC: FeatureCollection<Point, MapOverlayObservedPathPointsDataProps> = useMemo(() => {
		// Setup an empty feature collection
		const featureCollection = getBaseGeoJsonFeatureCollection<Point, MapOverlayObservedPathPointsDataProps>();
		// If no vehicle events data, return the empty feature collection
		if (!vehicleEventsData) return featureCollection;
		// Prepare the feature collection with vehicle events data
		featureCollection.features = vehicleEventsData
			.sort((a, b) => a.created_at - b.created_at)
			.filter(vehicleEvent => vehicleEvent.latitude && vehicleEvent.longitude)
			.map((vehicleEvent, index) => ({
				geometry: {
					coordinates: [vehicleEvent.longitude, vehicleEvent.latitude],
					type: 'Point',
				},
				properties: {
					id: vehicleEvent._id,
					sequence: index,
					stop_id: vehicleEvent.stop_id,
					timestamp: Dates
						.fromUnixMilliseconds(vehicleEvent.created_at)
						.setZone('local', 'offset_only')
						.toFormat('dd/MM/yyyy HH:mm:ss'),
					trigger_door: '-',
				},
				type: 'Feature',
			}));
		return featureCollection;
	}, [vehicleEventsData]);

	const observedShapeFC: FeatureCollection<LineString, MapOverlayObservedPathLineDataProps> = useMemo(() => {
		// If no vehicle events data, return an empty feature collection
		const featureCollection = getBaseGeoJsonFeatureCollection<LineString, MapOverlayObservedPathLineDataProps>();
		// If no vehicle events data, return the empty feature collection
		if (!vehicleEventsData) return featureCollection;
		// Prepare the feature collection with vehicle events data
		const lineString = getBaseGeoJsonFeature<LineString, MapOverlayObservedPathLineDataProps>('LineString');
		lineString.geometry.coordinates = vehicleEventsData
			.sort((a, b) => a.created_at - b.created_at)
			.filter(vehicleEvent => vehicleEvent.latitude && vehicleEvent.longitude)
			.map(vehicleEvent => [vehicleEvent.longitude, vehicleEvent.latitude]);
		lineString.properties['color'] = getCssVariableValue('--color-primary');
		featureCollection.features = [lineString];
		return featureCollection;
	}, [vehicleEventsData]);

	const scheduledPathFC: FeatureCollection<Point, MapOverlayScheduledPathPointsDataProps> = useMemo(() => {
		// Setup an empty feature collection
		const featureCollection = getBaseGeoJsonFeatureCollection<Point, MapOverlayScheduledPathPointsDataProps>();
		// If no hashed trip data, return the empty feature collection
		if (!hashedTripData?.length) return featureCollection;
		// Group simplified apex validations by stop ID
		const validationsByStopId: Record<string, SimplifiedApexValidation[]> = {};
		apexValidationsData?.forEach((validation) => {
			if (!validation.stop_id) return;
			if (!validation.is_passenger) return;
			if (!validationsByStopId[validation.stop_id]) validationsByStopId[validation.stop_id] = [];
			validationsByStopId[validation.stop_id].push(validation);
		});
		// Prepare the feature collection with hashed trip data
		featureCollection.features = hashedTripData
			.sort((a, b) => a.stop_sequence - b.stop_sequence)
			.map(waypoint => ({
				geometry: {
					coordinates: [waypoint.stop_lon, waypoint.stop_lat],
					type: 'Point',
				},
				properties: {
					arrival_time: waypoint.arrival_time,
					id: waypoint.stop_id,
					name: waypoint.stop_name,
					passengers_observed: validationsByStopId[waypoint.stop_id]?.length || 0,
					sequence: waypoint.stop_sequence,
				},
				type: 'Feature',
			}));
		return featureCollection;
	}, [hashedTripData, apexValidationsData]);

	const scheduledPathGeofencesFC: FeatureCollection<Polygon, MapOverlayGeofencesPolygonDataProps> = useMemo(() => {
		// Setup an empty feature collection
		const featureCollection = getBaseGeoJsonFeatureCollection<Polygon, MapOverlayGeofencesPolygonDataProps>();
		// If no hashed trip data or hashed shape data, return the empty feature collection
		if (!hashedTripData?.length) return featureCollection;
		// Prepare the feature collection with hashed trip data
		featureCollection.features = hashedTripData
			.sort((a, b) => a.stop_sequence - b.stop_sequence)
			.map((waypoint) => {
				const geofenceData = getGeofenceOnPosition([waypoint.stop_lon, waypoint.stop_lat], 50);
				return {
					...geofenceData,
					properties: {
						id: waypoint.stop_id,
					},
				};
			});
		return featureCollection;
	}, [hashedTripData]);

	const scheduledShapeFC: FeatureCollection<LineString, MapOverlayScheduledPathLineDataProps> = useMemo(() => {
		// Setup an empty feature collection
		const featureCollection = getBaseGeoJsonFeatureCollection<LineString, MapOverlayScheduledPathLineDataProps>();
		// If no ride data, return the empty feature collection
		if (!rideData?._id) return featureCollection;
		// If no hashed shape data, return the empty feature collection
		// If no hashed shape data, return the empty feature collection
		if (!hashedShapeData?.shape_polyline) return featureCollection;
		// Decode the polyline
		const decodedPolyline = fromEncodedPolylineToGeoJsonLineString(hashedShapeData.shape_polyline);
		// Build a feature of the decoded polyline
		const feature = getBaseGeoJsonFeature<LineString, MapOverlayScheduledPathLineDataProps>('LineString');
		feature.geometry = decodedPolyline;
		feature.properties.id = rideData._id;
		featureCollection.features.push(feature);
		return featureCollection;
	}, [rideData?._id, hashedShapeData?.shape_polyline]);

	//

	useEffect(() => {
		const cap = Math.max(0, observedEventsFC.features.length - 1);
		if (observedEventsFC.features.length === 0) {
			setReplayIndex(0);
			return;
		}
		if (prevRideIdRef.current !== rideId) {
			prevRideIdRef.current = rideId;
			setReplayIndex(cap);
			return;
		}
		setReplayIndex(prev => Math.min(prev, cap));
	}, [observedEventsFC.features.length, rideId]);

	const observedPointsData = useMemo(() => {
		if (!showReplay) return observedEventsFC;
		return {
			...observedEventsFC,
			features: observedEventsFC.features.slice(0, replayIndex + 1),
		};
	}, [showReplay, observedEventsFC, replayIndex]);

	const observedLineData = useMemo(() => {
		if (!showReplay) return observedShapeFC;
		const lineFeature = observedShapeFC.features[0];
		if (lineFeature?.geometry.type !== 'LineString') return observedShapeFC;
		const fullCoords = lineFeature.geometry.coordinates;
		let coordinates = fullCoords.slice(0, replayIndex + 1);
		if (coordinates.length === 1) {
			const c = coordinates[0];
			coordinates = [c, c];
		}
		return {
			...observedShapeFC,
			features: [
				{
					...lineFeature,
					geometry: {
						...lineFeature.geometry,
						coordinates,
					},
				},
			],
		};
	}, [showReplay, observedShapeFC, replayIndex]);

	const [showScheduledPath, setShowScheduledPath] = useState(true);
	const [showObservedPath, setShowObservedPath] = useState(true);
	const [showGeofences, setShowGeofences] = useState(false);

	const { t } = useTranslation();

	//
	// B. Render components

	return (
		<Collapsible
			description={t('default:rides.analysis.RideAnalysisMap.description')}
			title={t('default:rides.analysis.RideAnalysisMap.title')}
			defaultOpen
		>
			<div className={styles.mapWrapper}>
				<MapView id="RideAnalysisMap">
					<MapOverlayScheduledPath
						id="scheduled-path"
						lineData={scheduledShapeFC}
						pointsData={scheduledPathFC}
						visible={showScheduledPath}
					/>
					<MapOverlayObservedPath
						id="observed-path"
						lineData={observedLineData}
						pointsData={observedPointsData}
						visible={showObservedPath}
					/>
					<MapOverlayGeofences
						geofencesData={scheduledPathGeofencesFC}
						id="geofences"
						visible={showGeofences}
					/>
				</MapView>
			</div>
			<Divider />
			<Section alignItems="center" flexDirection="row" gap="md">
				<Switch checked={showScheduledPath} label={t('default:rides.analysis.RideAnalysisMap.switches.scheduled_path.label')} onChange={() => setShowScheduledPath(prev => !prev)} />
				<Switch checked={showObservedPath} label={t('default:rides.analysis.RideAnalysisMap.switches.observed_path.label')} onChange={() => setShowObservedPath(prev => !prev)} />
				<Switch checked={showGeofences} label={t('default:rides.analysis.RideAnalysisMap.switches.geofences.label')} onChange={() => setShowGeofences(prev => !prev)} />
			</Section>
			<Divider />
			{showReplay && <ReplayEvents onReplayIndexChange={setReplayIndex} replayIndex={replayIndex} />}
		</Collapsible>
	);
}
