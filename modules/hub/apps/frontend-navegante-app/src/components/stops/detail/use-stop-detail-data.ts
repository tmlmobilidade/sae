'use client';

import { useAlertsData } from '@/components/alerts/use-alerts-data';
import { useLinesData } from '@/components/lines/use-lines-data';
import { useStopsData } from '@/components/stops/use-stops-data';
import { useStopEtaData } from '@/hooks/transit/use-stop-eta-data';
import { useOperationalDate } from '@/hooks/transit/useOperationalDate';
import { fetchPatterns } from '@/utils/transit/fetch-patterns';
import { type HubAlert, type HubLine, type HubPattern, type HubStop } from '@tmlmobilidade/go-types-hub';
import { type OperationalDateInt, OperationalTimeSchema, type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { fromOperationalTimeAndOperationalDateToUnixMilliseconds } from '@tmlmobilidade/utils';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

export interface StopsDetailViewTimetableData {
	_id: string
	agency_id: string
	arrival_delay_ms: number
	arrival_effective_ms: null | UnixMilliseconds
	arrival_estimated_ms: null | UnixMilliseconds
	arrival_scheduled_ms: UnixMilliseconds
	color: string
	headsign: string
	is_first_stop: boolean
	is_last_stop: boolean
	is_past: boolean
	is_realtime: boolean
	line_id: string
	locality_names: string[]
	pattern_id: string
	shape_id: string
	short_name: string
	stop_sequence: number
	text_color: string
	trip_ids: string[]
	tts_headsign: string
}

interface UseStopDetailDataReturnType {
	activeAlerts: HubAlert[]
	associatedLines: HubLine[]
	isLoading: boolean
	stop: HubStop | undefined
	timetable: StopsDetailViewTimetableData[]
}

/* * */

export function useStopDetailData(stopId: string): UseStopDetailDataReturnType {
	//

	// A. Fetch data

	const { data: alerts } = useAlertsData();
	const { data: lines, isLoading: isLinesLoading } = useLinesData();
	const { data: stops, isLoading: isStopsLoading } = useStopsData();
	const { data: stopEtas } = useStopEtaData(stopId);
	const { isTodaySelected, selectedOperationalDate } = useOperationalDate();

	const stop = useMemo(() => stops.find(candidate => String(candidate._id) === String(stopId)), [stopId, stops]);
	const patternIds = stop?.pattern_ids ?? [];
	const { data: associatedPatterns, isLoading: isPatternsLoading } = useSWR<HubPattern[][]>(stop ? ['stop-patterns', ...patternIds] : null, async () => await fetchPatterns(patternIds));

	//
	// B. Transform data

	const associatedLines = useMemo(() => lines.filter(line => stop?.line_ids.includes(line._id)), [lines, stop?.line_ids]);
	const activeAlerts = useMemo(() => getStopAlerts(alerts, stop), [alerts, stop]);
	const validPatterns = useMemo(() => associatedPatterns?.flat().filter(pattern => selectedOperationalDate ? pattern.valid_on.includes(selectedOperationalDate) : false), [associatedPatterns, selectedOperationalDate]);
	const timetable = useMemo(() => buildStopTimetable({ isTodaySelected, selectedOperationalDate, stopEtas, stopId, validPatterns }), [isTodaySelected, selectedOperationalDate, stopEtas, stopId, validPatterns]);

	//
	// C. Return data

	return useMemo(() => ({
		activeAlerts,
		associatedLines,
		isLoading: isLinesLoading || isPatternsLoading || isStopsLoading,
		stop,
		timetable,
	}), [activeAlerts, associatedLines, isLinesLoading, isPatternsLoading, isStopsLoading, stop, timetable]);

	//
}

/* * */

function getStopAlerts(alerts: HubAlert[], stop: HubStop | undefined): HubAlert[] {
	if (!stop) return [];

	return alerts.filter((alert) => {
		if (alert.reference_type === 'agency') return stop.agency_ids.includes(alert.agency_id);
		if (alert.reference_type === 'stops') return alert.references.some(reference => reference.parent_id === String(stop._id));
		if (alert.reference_type === 'lines') return alert.references.some(reference => reference.child_ids.includes(String(stop._id)));
		return false;
	});
}

function buildStopTimetable({ isTodaySelected, selectedOperationalDate, stopEtas, stopId, validPatterns }: {
	isTodaySelected: boolean
	selectedOperationalDate: null | OperationalDateInt
	stopEtas: ReturnType<typeof useStopEtaData>['data']
	stopId: string
	validPatterns: HubPattern[] | undefined
}): StopsDetailViewTimetableData[] {
	if (!validPatterns || !selectedOperationalDate) return [];

	const timetable: StopsDetailViewTimetableData[] = [];
	for (const pattern of validPatterns) {
		for (const trip of pattern.trips) {
			if (!trip.valid_on.includes(selectedOperationalDate)) continue;

			for (const stopTime of trip.schedule) {
				if (String(stopTime.stop_id) !== String(stopId)) continue;

				const tripUpdate = stopEtas.find(eta => eta.trip_id.substring(eta.trip_id.indexOf(']') + 1) === trip.trip_ids.find(tripId => tripId.substring(tripId.indexOf(']') + 1) === eta.trip_id.substring(eta.trip_id.indexOf(']') + 1))?.substring(eta.trip_id.indexOf(']') + 1));
				const arrivalScheduledMs = fromOperationalTimeAndOperationalDateToUnixMilliseconds(OperationalTimeSchema.parse(stopTime.arrival_time), selectedOperationalDate);
				const arrivalEstimatedMs: null | UnixMilliseconds = tripUpdate?.eta_at ? Number(tripUpdate.eta_at) as UnixMilliseconds : null;
				const arrivalDelayMs = tripUpdate ? tripUpdate.eta_seconds * 1000 : 0;
				const arrivalEffectiveMs: UnixMilliseconds = arrivalEstimatedMs ?? arrivalScheduledMs;

				timetable.push({
					_id: `${selectedOperationalDate}-${pattern.version_id}-${trip.version_id}-${stopTime.stop_id}-${stopTime.stop_sequence}-${stopTime.arrival_time}`,
					agency_id: pattern.agency_id,
					arrival_delay_ms: arrivalDelayMs,
					arrival_effective_ms: arrivalEffectiveMs,
					arrival_estimated_ms: arrivalEstimatedMs,
					arrival_scheduled_ms: arrivalScheduledMs,
					color: pattern.color,
					headsign: pattern.headsign,
					is_first_stop: stopTime.stop_sequence === pattern.path[0].stop_sequence,
					is_last_stop: stopTime.stop_sequence === pattern.path[pattern.path.length - 1].stop_sequence,
					is_past: Number(arrivalEffectiveMs) < Dates.now('Europe/Lisbon').unix_milliseconds,
					is_realtime: arrivalEstimatedMs !== null && isTodaySelected,
					line_id: pattern.line_id,
					locality_names: pattern.locality_names,
					pattern_id: pattern._id,
					shape_id: pattern.shape_id,
					short_name: pattern.short_name,
					stop_sequence: stopTime.stop_sequence,
					text_color: pattern.text_color,
					trip_ids: trip.trip_ids,
					tts_headsign: pattern.tts_headsign,
				});
			}
		}
	}

	return timetable.sort((a, b) => Number(a.arrival_effective_ms) - Number(b.arrival_effective_ms));
}
