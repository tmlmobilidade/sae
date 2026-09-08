'use client';

import { VehiclesCounter } from '@/components/common/display/VehiclesCounter';
import { useRoutePlannerContext } from '@/components/routes/RoutePlanner.context';
import { useVehiclesData } from '@/components/vehicles/use-vehicles-data';
import { isVehicleIncludedInMap } from '@/utils/map/vehicle-visibility';
import { getRoutePlannerItineraryRouteDirections, isVehicleInRouteDirections } from '@/utils/route-planner/itinerary/vehicles';
import { useMemo } from 'react';

/* * */

export function RoutePlannerVehiclesCounter() {
	//

	//
	// A. Setup variables

	const routePlannerContext = useRoutePlannerContext();
	const { data: vehicles } = useVehiclesData();

	//
	// B. Transform data

	const routePlannerVehicleRouteDirections = useMemo(() => {
		return getRoutePlannerItineraryRouteDirections(routePlannerContext.data.selected_itinerary);
	}, [routePlannerContext.data.selected_itinerary]);

	const vehicleCount = useMemo(() => {
		return vehicles.filter((vehicle) => {
			return isVehicleIncludedInMap(vehicle) && isVehicleInRouteDirections(vehicle, routePlannerVehicleRouteDirections);
		}).length;
	}, [routePlannerVehicleRouteDirections, vehicles]);

	//
	// C. Render components

	return <VehiclesCounter count={vehicleCount} />;

	//
}
