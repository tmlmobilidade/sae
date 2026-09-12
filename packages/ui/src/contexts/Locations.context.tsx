'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type District, type Locality, type Municipality, type Parish } from '@tmlmobilidade/go-types-locations';
import { fetchData } from '@tmlmobilidade/utils';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/* * */

type DistrictsMap = Map<District['_id'], District>;
type MunicipalitiesMap = Map<Municipality['_id'], Municipality>;
type ParishesMap = Map<Parish['_id'], Parish>;
type LocalitiesMap = Map<Locality['_id'], Locality>;

interface LocationsData {
	districts: District[]
	localities: Locality[]
	municipalities: Municipality[]
	parishes: Parish[]
}

interface LocationsContextState {
	actions: {
		getDistrict: (districtId: string) => District | undefined
		getLocality: (localityId: string) => Locality | undefined
		getMunicipality: (municipalityId: string) => Municipality | undefined
		getParish: (parishId: string) => Parish | undefined
		queryLocation: (latitude: number, longitude: number) => Promise<Location | null>
	}
	data: {
		districts: DistrictsMap
		localities: LocalitiesMap
		municipalities: MunicipalitiesMap
		parishes: ParishesMap
	}
	flags: {
		is_loading: boolean
	}
}

/* * */

let cachedLocations: LocationsData | null = null;
let loadLocationsPromise: null | Promise<LocationsData> = null;

/**
 * Loads the locations data from the API.
 * @returns The locations data.
 */
async function loadLocations(): Promise<LocationsData> {
	// If the locations data is already cached, return it.
	if (cachedLocations) return cachedLocations;
	// If the locations data is already being loaded, return the promise.
	if (loadLocationsPromise !== null) return loadLocationsPromise;

	// Create a promise to load the locations data.
	loadLocationsPromise = (async () => {
		// Loads all locations data from the API at once.
		const [districts, municipalities, parishes, localities] = await Promise.all([
			fetchData<District[]>('API_ROUTES.locations.LOCATIONS_DISTRICTS'),
			fetchData<Municipality[]>('API_ROUTES.locations.LOCATIONS_MUNICIPALITIES'),
			fetchData<Parish[]>('API_ROUTES.locations.LOCATIONS_PARISHES'),
			fetchData<Locality[]>('API_ROUTES.locations.LOCATIONS_LOCALITIES'),
		]);

		// Cache the locations data.
		cachedLocations = {
			districts: districts.data ?? [],
			localities: localities.data ?? [],
			municipalities: municipalities.data ?? [],
			parishes: parishes.data ?? [],
		};

		// Return the cached locations data.
		return cachedLocations;
	})();

	// Wait for the promise to resolve.
	try {
		return await loadLocationsPromise;
	} finally {
		// Clear the promise.
		loadLocationsPromise = null;
	}
}

/* * */

const LocationsContext = createContext<LocationsContextState | undefined>(undefined);

/**
 * @deprecated Use an app/module specific hook with corresponding api route instead. See the core module for examples.
 */
export function useLocationsContext() {
	const context = useContext(LocationsContext);
	if (!context) {
		throw new Error('useLocationsContext must be used within a LocationsContextProvider');
	}
	return context;
}

/* * */

export const LocationsContextProvider = ({ children }: PropsWithChildren) => {
	//

	//
	// A. Fetch data

	const [locationsData, setLocationsData] = useState<LocationsData | null>(() => cachedLocations);
	const [isLoading, setIsLoading] = useState(() => !cachedLocations);

	/**
	 * Loads the locations data from the API when the component mounts.
	 * This is done to avoid loading the locations data multiple times.
	 */
	useEffect(() => {
		// If the locations data is already cached, do nothing.
		if (cachedLocations) return;

		// Create a flag to track if the effect has been cancelled.
		let cancelled = false;

		// Load the locations data.
		loadLocations()
			.then(data => !cancelled && setLocationsData(data))
			.finally(() => !cancelled && setIsLoading(false));

		// Return a function to set the cancelled flag to true.
		return () => {
			cancelled = true;
		};
	}, []);

	//
	// B. Transform data

	const districtsMap = useMemo(() => new Map(locationsData?.districts.map(item => [item._id, item]) ?? []), [locationsData?.districts]);
	const municipalitiesMap = useMemo(() => new Map(locationsData?.municipalities.map(item => [item._id, item]) ?? []), [locationsData?.municipalities]);
	const parishesMap = useMemo(() => new Map(locationsData?.parishes.map(item => [item._id, item]) ?? []), [locationsData?.parishes]);
	const localitiesMap = useMemo(() => new Map(locationsData?.localities.map(item => [item._id, item]) ?? []), [locationsData?.localities]);

	//
	// C. Handle actions

	const getDistrict = useCallback((id: District['_id']): District | undefined => districtsMap.get(id), [districtsMap]);
	const getLocality = useCallback((id: Locality['_id']): Locality | undefined => localitiesMap.get(id), [localitiesMap]);
	const getMunicipality = useCallback((id: Municipality['_id']): Municipality | undefined => municipalitiesMap.get(id), [municipalitiesMap]);
	const getParish = useCallback((id: Parish['_id']): Parish | undefined => parishesMap.get(id), [parishesMap]);
	const queryLocation = useCallback(async (latitude: number, longitude: number) => {
		const response = await fetchData<Location>(`${'API_ROUTES.locations.LOCATIONS_LOCATION'}?lat=${latitude}&lon=${longitude}`);
		return response.data ?? null;
	}, []);

	//
	// D. Define context value

	const contextValue: LocationsContextState = useMemo(() => ({
		actions: {
			getDistrict,
			getLocality,
			getMunicipality,
			getParish,
			queryLocation,
		},
		data: {
			districts: districtsMap,
			localities: localitiesMap,
			municipalities: municipalitiesMap,
			parishes: parishesMap,
		},
		flags: {
			is_loading: isLoading,
		},
	}), [getDistrict, getLocality, getMunicipality, getParish, queryLocation, districtsMap, localitiesMap, municipalitiesMap, parishesMap, isLoading]);

	//
	// E. Render components

	return (
		<LocationsContext.Provider value={contextValue}>
			{children}
		</LocationsContext.Provider>
	);

	//
};
