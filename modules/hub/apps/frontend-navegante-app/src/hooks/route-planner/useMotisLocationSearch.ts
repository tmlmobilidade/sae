'use client';

import { useStopsData } from '@/components/stops/use-stops-data';
import { useMotisGeocode } from '@/hooks/search/useMotisGeocode';
import { type RoutePlannerLocation } from '@/types/route-planner/models';
import { mapHubStopToRoutePlannerLocation } from '@/utils/route-planner/planning/locations';
import { routePlannerCoordinateToLocation } from '@/utils/search/motis-geocode';
import { normalizeSearchText } from '@/utils/search/normalize';
import { type HubStop } from '@tmlmobilidade/go-types-hub';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/* * */

interface UseMotisLocationSearchResult {
	data: RoutePlannerLocation[]
	error: null | string
	isLoading: boolean
}

/* * */

export function useMotisLocationSearch(query: string): UseMotisLocationSearchResult {
	//

	//
	// A. Setup variables

	const { data: stops } = useStopsData();
	const { t } = useTranslation();
	const coordinateLocation = routePlannerCoordinateToLocation(query.trim(), t('default:common.locations.coordinates'));
	const localStopResults = useMemo(() => searchStops(stops, query), [query, stops]);
	const motisSearch = useMotisGeocode(query, {
		enabled: !coordinateLocation,
		errorMessage: t('default:routes.RoutePlannerInput.search.error'),
		unnamedLocationLabel: t('default:common.locations.unnamed'),
	});

	//
	// B. Transform data

	const data = coordinateLocation ? [coordinateLocation] : [...localStopResults, ...motisSearch.data];
	const error = localStopResults.length > 0 ? null : motisSearch.error;

	//
	// C. Return values

	return { data, error, isLoading: motisSearch.isLoading };

	//
}

/* * */

function searchStops(stops: HubStop[], query: string): RoutePlannerLocation[] {
	const normalizedQuery = normalizeSearchText(query);
	if (normalizedQuery.length < 2) return [];

	return stops
		.filter(stop => normalizeSearchText(`${stop.name} ${stop.short_name} ${stop.locality_name ?? ''} ${stop.municipality_name}`).includes(normalizedQuery))
		.slice(0, 8)
		.map(stop => mapHubStopToRoutePlannerLocation(stop));
}
