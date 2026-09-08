'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { getBaseGeoJsonFeatureCollection } from '@tmlmobilidade/geo';
import { type HubV1ApiVehiclePosition } from '@tmlmobilidade/go-types-hub';
import { fetchApiData } from '@tmlmobilidade/ui';
import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';
import useSWR from 'swr';

/* * */

interface VehiclesContextState {
	actions: {
		getVehicleById: (vehicleId: string) => HubV1ApiVehiclePosition | undefined
		getVehicleByIdGeoJsonFC: (vehicleId: string) => GeoJSON.FeatureCollection | undefined
		getVehiclesByLineId: (lineId: string) => HubV1ApiVehiclePosition[]
		getVehiclesByLineIdGeoJsonFC: (lineId: string) => GeoJSON.FeatureCollection | undefined
		getVehiclesByPatternId: (patternId: string) => HubV1ApiVehiclePosition[]
		getVehiclesByPatternIdGeoJsonFC: (patternId: string) => GeoJSON.FeatureCollection | undefined
		getVehiclesByTripId: (tripId: string) => HubV1ApiVehiclePosition[]
		getVehiclesByTripIdGeoJsonFC: (tripId: string) => GeoJSON.FeatureCollection | undefined
	}
	data: {
		fc: GeoJSON.FeatureCollection<GeoJSON.Point, HubV1ApiVehiclePosition>
		vehicles: HubV1ApiVehiclePosition[]
	}
	flags: {
		isLoading: boolean
	}
}

/* * */

const VehiclesContext = createContext<undefined | VehiclesContextState>(undefined);

export function useVehiclesContext() {
	const context = useContext(VehiclesContext);
	if (!context) {
		throw new Error('useVehiclesContext must be used within a VehiclesContextProvider');
	}
	return context;
}

/* * */

export function VehiclesContextProvider({ children }: PropsWithChildren) {
	//

	//
	// A. Fetch data

	// <HubV1ApiVehiclePosition[], Error>
	const { data: allVehiclesPositionsData, isLoading: allVehiclesPositionsLoading } = useSWR(API_ROUTES.hub.REALTIME_VEHICLES_POSITIONS, {
		fetcher: async (url: string) => await fetchApiData<HubV1ApiVehiclePosition[]>({ credentials: 'omit', url }),
		refreshInterval: 5_000, // 5 seconds
	});

	//
	// B. Transform data

	const vehiclesGeoJsonFeatureCollection = useMemo(() => {
		const collection = getBaseGeoJsonFeatureCollection<GeoJSON.Point, HubV1ApiVehiclePosition>();
		allVehiclesPositionsData?.data?.forEach((vehicle) => {
			// Skip if vehicle position is not from an allowed agency
			if (![
				'7NTB1', // Fertagus
				'A2L1N', // Alsa (CM)
				'A3H3M', // TCB
				'BNA17', // Rodoviária de Lisboa (CM)
				'HF16N', // MobiCascais
				'IA2N9', // Metro de Lisboa
				'IA9T6', // Carris
				'KB1F6', // Metro Transportes do Sul
				'LA77N', // Viação Alvorada (CM)
				'LTP61', // Transtejo
				'N18KL', // Comboios de Portugal
				'YA15B', // TST (CM)
			].includes(vehicle.agency_id)) return;
			// Skip if the vehicle position does not have the minimum
			// required fields to identify the current service
			if (!vehicle.trip_id || !vehicle.route_id || vehicle.direction_id === undefined || vehicle.direction_id === null) return;
			// Add the vehicle position to the collection
			collection.features.push(transformVehicleDataIntoGeoJsonFeature(vehicle));
		});
		return collection;
	}, [allVehiclesPositionsData]);

	//
	// B. Handle actions

	const getVehicleById = (vehicleId: string): HubV1ApiVehiclePosition | undefined => {
		return allVehiclesPositionsData?.data?.find(vehicle => vehicle._id === vehicleId);
	};

	const getVehicleByIdGeoJsonFC = (vehicleId: string): GeoJSON.FeatureCollection | undefined => {
		const vehicle = getVehicleById(vehicleId);
		if (!vehicle) return;
		const collection = getBaseGeoJsonFeatureCollection();
		collection.features.push(transformVehicleDataIntoGeoJsonFeature(vehicle));
		return collection;
	};

	const getVehiclesByLineId = (lineId: string): HubV1ApiVehiclePosition[] => {
		return allVehiclesPositionsData?.data?.filter(vehicle => vehicle.trip_id === lineId) || [];
	};

	const getVehiclesByLineIdGeoJsonFC = (lineId: string): GeoJSON.FeatureCollection | undefined => {
		const vehicles = getVehiclesByLineId(lineId);
		if (!vehicles) return;
		const collection = getBaseGeoJsonFeatureCollection();
		vehicles.forEach(vehicle => collection.features.push(transformVehicleDataIntoGeoJsonFeature(vehicle)));
		return collection;
	};

	const getVehiclesByPatternId = (patternId: string): HubV1ApiVehiclePosition[] => {
		return allVehiclesPositionsData?.data?.filter(vehicle => vehicle.trip_id === patternId) || [];
	};

	const getVehiclesByPatternIdGeoJsonFC = (patternId: string) => {
		const vehicles = getVehiclesByPatternId(patternId);
		if (!vehicles) return;
		const collection = getBaseGeoJsonFeatureCollection();
		vehicles.forEach(vehicle => collection.features.push(transformVehicleDataIntoGeoJsonFeature(vehicle)));
		return collection;
	};

	const getVehiclesByTripId = (tripId: string): HubV1ApiVehiclePosition[] => {
		return allVehiclesPositionsData?.data?.filter(vehicle => vehicle.trip_id === tripId) || [];
	};

	const getVehiclesByTripIdGeoJsonFC = (tripId: string) => {
		const vehicles = getVehiclesByTripId(tripId);
		if (!vehicles) return;
		const collection = getBaseGeoJsonFeatureCollection();
		vehicles.forEach(vehicle => collection.features.push(transformVehicleDataIntoGeoJsonFeature(vehicle)));
		return collection;
	};

	//
	// C. Define context value

	const contextValue: VehiclesContextState = {
		actions: {
			getVehicleById,
			getVehicleByIdGeoJsonFC,
			getVehiclesByLineId,
			getVehiclesByLineIdGeoJsonFC,
			getVehiclesByPatternId,
			getVehiclesByPatternIdGeoJsonFC,
			getVehiclesByTripId,
			getVehiclesByTripIdGeoJsonFC,
		},
		data: {
			fc: vehiclesGeoJsonFeatureCollection,
			vehicles: allVehiclesPositionsData?.data || [],
		},
		flags: {
			isLoading: allVehiclesPositionsLoading,
		},
	};

	//
	// D. Render components

	return (
		<VehiclesContext.Provider value={contextValue}>
			{children}
		</VehiclesContext.Provider>
	);

	//
};

/* * */

export function transformVehicleDataIntoGeoJsonFeature(vehicleData: HubV1ApiVehiclePosition): GeoJSON.Feature<GeoJSON.Point, HubV1ApiVehiclePosition> {
	return {
		geometry: {
			coordinates: [vehicleData.longitude || 0, vehicleData.latitude || 0],
			type: 'Point',
		},
		id: String(vehicleData.vehicle_id),
		properties: vehicleData,
		type: 'Feature',
	};
}
