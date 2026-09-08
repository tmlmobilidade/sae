'use client';

import { useVehiclesData } from '@/components/vehicles/use-vehicles-data';
import { type HubVehiclePosition } from '@tmlmobilidade/go-types-hub';
import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';

/* * */

interface VehiclesDetailContextState {
	data: {
		vehicle: HubVehiclePosition | null
	}
}

/* * */

const VehiclesDetailContext = createContext<undefined | VehiclesDetailContextState>(undefined);

export function useVehiclesDetailContext() {
	const context = useContext(VehiclesDetailContext);
	if (!context) {
		throw new Error('useVehiclesDetailContext must be used within a VehiclesDetailContextProvider');
	}
	return context;
}

/* * */

export const VehiclesDetailContextProvider = ({ children, vehicleId }: PropsWithChildren<{ vehicleId: string }>) => {
	//

	//
	// A. Setup variables

	const { data: vehicles } = useVehiclesData();

	//
	// B. Transform data

	const vehicleData = useMemo(() => {
		return vehicles.find(vehicle => vehicle.vehicle_id === vehicleId);
	}, [vehicleId, vehicles]);

	//
	// E. Define context value

	const contextValue = useMemo<VehiclesDetailContextState>(() => ({
		data: {
			vehicle: vehicleData,
		},
	}), [vehicleData]);

	//
	// F. Render components

	return (
		<VehiclesDetailContext.Provider value={contextValue}>
			{children}
		</VehiclesDetailContext.Provider>
	);

	//
};
