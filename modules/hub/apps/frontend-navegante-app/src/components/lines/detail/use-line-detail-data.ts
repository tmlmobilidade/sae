'use client';

import { useAlertsData } from '@/components/alerts/use-alerts-data';
import { useLinesData } from '@/components/lines/use-lines-data';
import { useRoutesData } from '@/components/lines/use-routes-data';
import { useStopsData } from '@/components/stops/use-stops-data';
import { useOperationalDate } from '@/hooks/transit/useOperationalDate';
import { fetchPatterns } from '@/utils/transit/fetch-patterns';
import { API_ROUTES } from '@tmlmobilidade/consts';
import { type HubAlert, type HubLine, type HubPattern, type HubRoute, type HubStop } from '@tmlmobilidade/go-types-hub';
import { type OperationalDateInt } from '@tmlmobilidade/go-types-shared';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

interface UseLineDetailDataReturnType {
	activeAlerts: HubAlert[]
	allPatterns: HubPattern[][] | null
	isLoading: boolean
	line: HubLine | undefined
	routes: HubRoute[]
	validPatterns: HubPattern[] | undefined
}

/* * */

export function useLineDetailData(lineId: null | string): UseLineDetailDataReturnType {
	//

	//
	// A. Fetch data

	const { data: alerts } = useAlertsData();
	const { data: lines, isLoading: isLinesLoading } = useLinesData();
	const { data: routes, isLoading: isRoutesLoading } = useRoutesData();
	const { data: stops, isLoading: isStopsLoading } = useStopsData();
	const { selectedOperationalDate } = useOperationalDate();

	const line = useMemo(() => lines.find(item => item._id === lineId), [lineId, lines]);
	const patternIds = line?.pattern_ids ?? [];
	const patternsKey = line ? [API_ROUTES.hub.NETWORK_PATTERNS(line._id), ...patternIds] : null;
	const { data: fetchedPatterns, isLoading: isPatternsLoading } = useSWR<HubPattern[][]>(patternsKey, async () => await fetchPatterns(patternIds));

	//
	// B. Transform data

	const allPatterns = useMemo(() => enrichPatternsWithStops(fetchedPatterns, stops), [fetchedPatterns, stops]);
	const validPatterns = useMemo(() => selectPatternsForOperationalDate(allPatterns, selectedOperationalDate), [allPatterns, selectedOperationalDate]);
	const activeAlerts = useMemo(() => filterAlertsForLine(alerts, line, lineId), [alerts, line, lineId]);
	const lineRoutes = useMemo(() => routes.filter(route => line?.route_ids.includes(route._id)), [line?.route_ids, routes]);

	//
	// C. Return data

	return useMemo(() => ({
		activeAlerts,
		allPatterns,
		isLoading: isLinesLoading || isPatternsLoading || isRoutesLoading || isStopsLoading || (lineId !== null && !line),
		line,
		routes: lineRoutes,
		validPatterns,
	}), [activeAlerts, allPatterns, isLinesLoading, isPatternsLoading, isRoutesLoading, isStopsLoading, line, lineId, lineRoutes, validPatterns]);

	//
}

/* * */

function enrichPatternsWithStops(patterns: HubPattern[][] | undefined, stops: HubStop[]): HubPattern[][] | null {
	if (!patterns) return null;

	return patterns.map(patternGroups => patternGroups.map(patternGroup => ({
		...patternGroup,
		path: patternGroup.path.map((waypoint) => {
			const stop = stops.find(candidate => String(candidate._id) === String(waypoint.stop_id));
			return stop ? { ...waypoint, stop } : waypoint;
		}),
	})));
}

/* * */

function selectPatternsForOperationalDate(allPatterns: HubPattern[][] | null, selectedOperationalDate: null | OperationalDateInt): HubPattern[] | undefined {
	if (!allPatterns || !selectedOperationalDate) return;

	const activePatterns: HubPattern[] = [];
	for (const patternGroups of allPatterns) {
		let closestDateSoFar: null | OperationalDateInt = null;
		let patternWithClosestDate: HubPattern | null = null;

		for (const patternGroup of patternGroups) {
			const closestDate = patternGroup.valid_on.reduce<null | OperationalDateInt>((currentClosestDate, currentDate) => {
				if (selectedOperationalDate <= currentDate && (currentClosestDate === null || currentDate < currentClosestDate)) return currentDate;
				return currentClosestDate;
			}, null);

			if (closestDate !== null && (closestDateSoFar === null || closestDate <= closestDateSoFar)) {
				patternWithClosestDate = patternGroup;
				closestDateSoFar = closestDate;
			}
		}

		if (patternWithClosestDate && !activePatterns.some(activePattern => activePattern._id === patternWithClosestDate._id)) {
			activePatterns.push(patternWithClosestDate);
		}
	}

	return activePatterns.sort((a, b) => a._id.localeCompare(b._id));
}

function filterAlertsForLine(alerts: HubAlert[], line: HubLine | undefined, lineId: null | string): HubAlert[] {
	return alerts.filter((alert) => {
		if (!alert.active_period_start_date && alert.active_period_end_date) return false;

		return alert.references.some((reference) => {
			const normalizedLineId = lineId?.trim();
			const lineAgencyId = line?.agency_id?.trim();
			const informedAgencyId = reference.parent_id?.trim();

			if (informedAgencyId) {
				const informedBracketAgency = informedAgencyId.match(/^\[([^\]]+)\]/)?.[1] ?? informedAgencyId;
				if (informedBracketAgency !== lineAgencyId) return false;
			}

			if (reference.parent_id != null) return reference.parent_id.trim() === normalizedLineId;
			if (reference.child_ids.length > 0) return line?.route_ids?.includes(reference.child_ids[0]) ?? false;
			return true;
		});
	});
}
