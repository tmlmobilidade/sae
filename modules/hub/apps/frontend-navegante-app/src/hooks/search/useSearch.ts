'use client';

import { useAlertsData } from '@/components/alerts/use-alerts-data';
import { useLinesData } from '@/components/lines/use-lines-data';
import { useStopsData } from '@/components/stops/use-stops-data';
import { useUserLocation } from '@/contexts/UserLocation.context';
import { useMotisGeocode } from '@/hooks/search/useMotisGeocode';
import { type SearchGroup, type SearchResult } from '@/types/common/search';
import { type RoutePlannerLocation } from '@/types/route-planner/models';
import { normalizeSearchText } from '@/utils/search/normalize';
import { type HubAlert, type HubLine, type HubStop } from '@tmlmobilidade/go-types-hub';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/* * */

interface UseSearchResult {
	error: null | string
	groups: SearchGroup[]
	isLoading: boolean
}

interface SearchCoordinates {
	latitude: number
	longitude: number
}

/* * */

const GROUP_TIE_BREAKERS: Record<SearchResult['type'], number> = { alert: 0, line: 1, poi: 3, stop: 2 };
const MOTIS_PLACE_BIAS = 1;
const RESULTS_PER_GROUP = 5;
const DEFAULT_SEARCH_COORDINATES: SearchCoordinates = { latitude: 38.7223, longitude: -9.1393 };

/* * */

export function useSearch(query: string): UseSearchResult {
	//

	// A. Setup variables

	const { data: alerts } = useAlertsData();
	const { data: lines } = useLinesData();
	const { data: stops } = useStopsData();
	const userLocationContext = useUserLocation();
	const { t } = useTranslation();
	const userCoordinates = useMemo(() => getSearchCoordinates(userLocationContext.data.location), [userLocationContext.data.location?.latitude, userLocationContext.data.location?.longitude]);
	const searchBiasCoordinates = userCoordinates ?? DEFAULT_SEARCH_COORDINATES;
	const normalizedQuery = normalizeSearchText(query).trim();
	const motisSearch = useMotisGeocode(query, {
		errorMessage: t('default:search.Search.error'),
		placeBias: {
			latitude: searchBiasCoordinates.latitude,
			longitude: searchBiasCoordinates.longitude,
			weight: MOTIS_PLACE_BIAS,
		},
		unnamedLocationLabel: t('default:common.locations.unnamed'),
	});

	//
	// C. Transform data

	const groups = useMemo(() => {
		if (!normalizedQuery) return getAgencyAlertGroup(alerts);
		if (normalizedQuery.length < 2) return [];

		const results: SearchResult[] = [
			...alerts.map(alert => toResult('alert', alert, `${alert.title} ${alert.description}`, normalizedQuery)),
			...lines.map(line => toResult('line', line, `${line.short_name} ${line.long_name}`, normalizedQuery)),
			...stops.map(stop => toResult('stop', stop, `${stop.name} ${stop.short_name} ${stop.locality_name ?? ''} ${stop.municipality_name}`, normalizedQuery)),
			...motisSearch.data.map(location => toPoiResult(location, normalizedQuery)),
		].filter((result): result is SearchResult => result !== null);

		return groupResults(results);
	}, [alerts, lines, motisSearch.data, normalizedQuery, stops]);

	return { error: motisSearch.error, groups, isLoading: motisSearch.isLoading };
}

/* * */

function toResult<T extends HubAlert | HubLine | HubStop | RoutePlannerLocation>(type: SearchResult['type'], entity: T, searchableText: string, query: string): null | SearchResult {
	const score = getMatchScore(searchableText, query);
	if (score === 0) return null;

	if (type === 'alert') return { entity: entity as HubAlert, id: (entity as HubAlert)._id, label: (entity as HubAlert).title, score, type };
	if (type === 'line') return { entity: entity as HubLine, id: (entity as HubLine)._id, label: (entity as HubLine).long_name, score, type };
	if (type === 'stop') return { entity: entity as HubStop, id: String((entity as HubStop)._id), label: (entity as HubStop).name, score, type };
	return { entity: entity as RoutePlannerLocation, id: (entity as RoutePlannerLocation).id ?? (entity as RoutePlannerLocation).label, label: (entity as RoutePlannerLocation).label, score, type: 'poi' };
}

function toPoiResult(location: RoutePlannerLocation, query: string): Extract<SearchResult, { type: 'poi' }> {
	const searchableText = `${location.label} ${location.detail} ${location.street ?? ''}`;
	const groupScore = getMatchScore(searchableText, query) || 200;

	return {
		entity: location,
		id: location.id ?? location.label,
		label: location.label,
		score: groupScore,
		type: 'poi',
	};
}

function getAgencyAlertGroup(alerts: HubAlert[]): SearchGroup[] {
	const now = Date.now() / 1000;
	const agencyAlerts = alerts
		.filter(alert => alert.reference_type === 'agency' && (!alert.active_period_start_date || alert.active_period_start_date <= now) && (!alert.active_period_end_date || alert.active_period_end_date >= now));
	const highlightedAlerts = agencyAlerts.length
		? agencyAlerts.slice(0, RESULTS_PER_GROUP)
		: [...alerts].sort((a, b) => b.active_period_start_date - a.active_period_start_date).slice(0, 3);
	const results = highlightedAlerts
		.map(alert => ({ entity: alert, id: alert._id, label: alert.title, score: 1, type: 'alert' as const }))
		.slice(0, RESULTS_PER_GROUP);

	return results.length ? [{ key: 'alert', results }] : [];
}

function groupResults(results: SearchResult[]): SearchGroup[] {
	const groups = new Map<SearchResult['type'], SearchResult[]>();
	results.forEach((result) => {
		const current = groups.get(result.type) ?? [];
		current.push(result);
		groups.set(result.type, current);
	});

	return Array.from(groups.entries())
		.map(([key, groupResults]) => ({
			key,
			results: key === 'poi'
				? groupResults.slice(0, RESULTS_PER_GROUP)
				: groupResults.sort(compareResults).slice(0, RESULTS_PER_GROUP),
		}))
		.sort((a, b) => getGroupScore(b) - getGroupScore(a) || GROUP_TIE_BREAKERS[a.key] - GROUP_TIE_BREAKERS[b.key]);
}

function getGroupScore(group: SearchGroup) {
	return Math.max(...group.results.map(result => result.score));
}

function compareResults(a: SearchResult, b: SearchResult) {
	if (b.score !== a.score) return b.score - a.score;
	return a.label.localeCompare(b.label);
}

function getSearchCoordinates(userLocation: null | Partial<SearchCoordinates>): null | SearchCoordinates {
	if (!Number.isFinite(userLocation?.latitude) || !Number.isFinite(userLocation?.longitude)) return null;
	return { latitude: userLocation.latitude, longitude: userLocation.longitude };
}

function getMatchScore(value: string, query: string) {
	const normalizedValue = normalizeSearchText(value).trim();
	if (normalizedValue === query) return 1_000;
	if (normalizedValue.startsWith(query)) return 800;
	const queryTokens = query.split(' ').filter(Boolean);
	const valueTokens = normalizedValue.split(/\s+/);
	if (queryTokens.every(token => valueTokens.some(valueToken => valueToken.startsWith(token)))) return 600;
	if (normalizedValue.includes(query)) return 400;
	return 0;
}
