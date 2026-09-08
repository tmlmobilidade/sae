'use client';

import { useStopsData } from '@/components/stops/use-stops-data';
import { getBaseGeoJsonFeatureCollection } from '@tmlmobilidade/geo';
import { type HubStop } from '@tmlmobilidade/go-types-hub';
import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { useMemo } from 'react';

/* * */

interface UseStopsMapDataReturnType {
	data: GeoJSON.FeatureCollection<GeoJSON.Point, HubStop>
	entities: HubStop[]
	error: null | string
	isLoading: boolean
	isValidating: boolean
	mutate: () => void
	timestamp: null | UnixMilliseconds
}

/* * */

function buildStopsFeatureCollection(stops: HubStop[]): GeoJSON.FeatureCollection<GeoJSON.Point, HubStop> {
	const collection = getBaseGeoJsonFeatureCollection<GeoJSON.Point, HubStop>();
	for (const stop of stops) collection.features.push(transformStopDataIntoGeoJsonFeature(stop));
	return collection;
}

function transformStopDataIntoGeoJsonFeature(stop: HubStop): GeoJSON.Feature<GeoJSON.Point, HubStop> {
	const properties = Object.fromEntries(Object.entries(stop).filter(([, value]) => value !== undefined && value !== null)) as HubStop;

	return {
		geometry: {
			coordinates: [stop.longitude, stop.latitude],
			type: 'Point',
		},
		properties,
		type: 'Feature',
	};
}

/* * */

export function useStopsMapData(): UseStopsMapDataReturnType {
	//

	//
	// A. Setup variables

	const { data: stops, error, isLoading, isValidating, mutate, timestamp } = useStopsData();

	//
	// B. Transform data

	const data = useMemo(() => buildStopsFeatureCollection(stops), [stops]);

	//
	// C. Return data

	return useMemo(() => ({
		data,
		entities: stops,
		error,
		isLoading,
		isValidating,
		mutate,
		timestamp,
	}), [data, error, isLoading, isValidating, mutate, stops, timestamp]);

	//
}
