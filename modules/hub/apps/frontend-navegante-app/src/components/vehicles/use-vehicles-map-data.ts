'use client';

import { useVehiclesData } from '@/components/vehicles/use-vehicles-data';
import { buildVehiclesFeatureCollection } from '@/utils/map/entity-feature-collections';
import { type HubVehiclePosition } from '@tmlmobilidade/go-types-hub';
import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { useMemo } from 'react';

/* * */

interface UseVehiclesMapDataReturnType {
	data: GeoJSON.FeatureCollection<GeoJSON.Point, HubVehiclePosition>
	entities: HubVehiclePosition[]
	error: null | string
	isLoading: boolean
	isValidating: boolean
	mutate: () => void
	timestamp: null | UnixMilliseconds
}

/* * */

export function useVehiclesMapData(): UseVehiclesMapDataReturnType {
	//

	//
	// A. Setup variables

	const { data: vehicles, error, isLoading, isValidating, mutate, timestamp } = useVehiclesData();

	//
	// B. Transform data

	const data = useMemo(() => buildVehiclesFeatureCollection(vehicles), [vehicles]);

	//
	// C. Return data

	return useMemo(() => ({
		data,
		entities: vehicles,
		error,
		isLoading,
		isValidating,
		mutate,
		timestamp,
	}), [data, error, isLoading, isValidating, mutate, timestamp, vehicles]);

	//
}
