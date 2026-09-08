'use client';

import { useAlertsData } from '@/components/alerts/use-alerts-data';
import { useLinesData } from '@/components/lines/use-lines-data';
import { useStopsData } from '@/components/stops/use-stops-data';
import { useStopEtaData } from '@/hooks/transit/use-stop-eta-data';
import { useOperationalDate } from '@/hooks/transit/useOperationalDate';
import { fetchPatterns } from '@/utils/transit/fetch-patterns';
import { type HubAlert, type HubLine, type HubPattern, type HubStop } from '@tmlmobilidade/go-types-hub';
import { OperationalTimeSchema, type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { fromOperationalTimeAndOperationalDateToUnixMilliseconds } from '@tmlmobilidade/utils';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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

interface StopsDetailContextState {
	actions: {
		resetActiveTripId: () => void
		setActiveTripId: (tripId: string, stopSequence: number) => void
	}
	data: {
		active_alerts: HubAlert[]
		associated_lines: HubLine[]
		highlighted_pattern: HubPattern
		highlighted_stop_sequence: number
		highlighted_trip_id: string
		stop: HubStop
		timetable: StopsDetailViewTimetableData[]
	}
	flags: {
		is_loading: boolean
	}
}

/* * */

const StopsDetailContext = createContext<StopsDetailContextState | undefined>(undefined);

export function useStopsDetailContext() {
	const context = useContext(StopsDetailContext);
	if (!context) {
		throw new Error('useStopsDetailContext must be used within a StopsDetailContextProvider');
	}
	return context;
}

/* * */

export function StopsDetailContextProvider({ children, stopId }: PropsWithChildren<{ stopId: string }>) {
	//

	//
	// A. Setup variables

	const { data: alerts } = useAlertsData();
	const { data: lines, isLoading: isLinesLoading } = useLinesData();
	const { data: stops, isLoading: isStopsLoading } = useStopsData();
	const { data: stopEtas } = useStopEtaData(stopId);
	const operationalDate = useOperationalDate();

	const [isLoading, setIsLoading] = useState<boolean>(false);

	const [associatedPatternsData, setAssociatedPatternsData] = useState<HubPattern[][]>();

	const [highlightedPattern, setHighlightedPattern] = useState<HubPattern>();
	const [highlightedTripId, setHighlightedTripId] = useState<string>();
	const [highlightedStopSequence, setHighlightedStopSequence] = useState<number>();

	//
	// B. Fetch data

	const selectedStopData = useMemo(() => {
		if (!stopId || !stops.length) return;
		return stops.find(stop => String(stop._id) === String(stopId));
	}, [stopId, stops]);

	const associatedLinesData = useMemo(() => {
		if (!selectedStopData) return;
		return lines.filter(line => selectedStopData.line_ids.includes(line._id));
	}, [lines, selectedStopData]);

	useEffect(() => {
		(async () => {
			if (!selectedStopData) return;
			setIsLoading(true);
			const patternsData = await fetchPatterns(selectedStopData.pattern_ids);
			setAssociatedPatternsData(patternsData);
			setIsLoading(false);
		})();
	}, [selectedStopData]);

	//
	// C. Transform data

	const activeAlertsData = useMemo(() => {
		// Skip if no data is available
		if (!selectedStopData) return [];
		// Return active alerts for the selected stop
		return alerts.filter((alert) => {
			// Include this alert if it is associated with any of the selected stop's agencies
			if (alert.reference_type === 'agency') return selectedStopData.agency_ids.includes(alert.agency_id);
			// Include this alert if it directly assigned to the selected stop
			if (alert.reference_type === 'stops') return alert.references.some(reference => reference.parent_id === String(selectedStopData._id));
			// Include this alert if it is associated with any of the selected stop's lines
			if (alert.reference_type === 'lines') return alert.references.some(reference => reference.child_ids.includes(String(selectedStopData._id)));
			// Otherwise, exclude this alert
			return false;
		});
	}, [alerts, selectedStopData]);

	const validPatternsData = useMemo(() => {
		// Skip if no associated patterns data or no operational date is selected
		if (!associatedPatternsData || !operationalDate.selectedOperationalDate) return;
		// Return patterns with trips on the selected operational date
		return associatedPatternsData
			.flat()
			.filter(patternGroup => patternGroup.valid_on.includes(operationalDate.selectedOperationalDate));
	}, [associatedPatternsData, operationalDate.selectedOperationalDate]);

	const timetableDataForSelectedDate = useMemo(() => {
		// Skip if no valid patterns data or no operational date is selected
		if (!validPatternsData || !operationalDate.selectedOperationalDate) return;
		// Initialize the timetable data for the selected date
		const timetableDataForSelectedDate: StopsDetailViewTimetableData[] = [];
		// Loop through each valid pattern, and each trip of the pattern
		for (const patternData of validPatternsData) {
			for (const tripData of patternData.trips) {
				// Skip if this trip is not valid for the selected operational date
				if (!tripData.valid_on.includes(operationalDate.selectedOperationalDate)) continue;
				// Loop through each stop time of the trip
				for (const stopTime of tripData.schedule) {
					// Skip if this stop time is not for the selected stop
					if (String(stopTime.stop_id) !== String(stopId)) continue;
					// Set a unique and stable ID for this arrival data
					const uniqueIdValueForArrivalData = `${operationalDate.selectedOperationalDate}-${patternData.version_id}-${tripData.version_id}-${stopTime.stop_id}-${stopTime.stop_sequence}-${stopTime.arrival_time}`;
					// Convert GTFS time string to Unix Timestamp
					const scheduledArrivalMs = fromOperationalTimeAndOperationalDateToUnixMilliseconds(OperationalTimeSchema.parse(stopTime.arrival_time), operationalDate.selectedOperationalDate);
					// Fetch the trip update for this stop time
					const tripUpdate = stopEtas.find(eta => eta.trip_id.substring(eta.trip_id.indexOf(']') + 1) === tripData.trip_ids.find(tripId => tripId.substring(tripId.indexOf(']') + 1) === eta.trip_id.substring(eta.trip_id.indexOf(']') + 1))?.substring(eta.trip_id.indexOf(']') + 1)) ?? undefined;
					// Extract the arrival time, delay and effective arrival time
					// from the trip update, if any was found
					const estimatedArrivalMs = tripUpdate?.eta_at;
					const arrivalDelayMs = tripUpdate?.eta_seconds * 1000;
					const effectiveArrivalMs = estimatedArrivalMs || scheduledArrivalMs;
					// Detect the position of this stop time in the pattern
					const isFirstStop = stopTime.stop_sequence === patternData.path[0].stop_sequence;
					const isLastStop = stopTime.stop_sequence === patternData.path[patternData.path.length - 1].stop_sequence;
					// Detect the temporal status of this stop time
					const isPast = Number(effectiveArrivalMs) < Dates.now('Europe/Lisbon').unix_milliseconds;
					const isRealtime = !!estimatedArrivalMs && operationalDate.isTodaySelected;
					// Add this stop time to the timetable array
					timetableDataForSelectedDate.push({
						_id: uniqueIdValueForArrivalData,
						agency_id: patternData.agency_id,
						arrival_delay_ms: arrivalDelayMs,
						arrival_effective_ms: Number(effectiveArrivalMs) as UnixMilliseconds,
						arrival_estimated_ms: Number(estimatedArrivalMs) as UnixMilliseconds,
						arrival_scheduled_ms: scheduledArrivalMs,
						color: patternData.color,
						headsign: patternData.headsign,
						is_first_stop: isFirstStop,
						is_last_stop: isLastStop,
						is_past: isPast,
						is_realtime: isRealtime,
						line_id: patternData.line_id,
						locality_names: patternData.locality_names,
						pattern_id: patternData._id,
						shape_id: patternData.shape_id,
						short_name: patternData.short_name,
						stop_sequence: stopTime.stop_sequence,
						text_color: patternData.text_color,
						trip_ids: tripData.trip_ids,
						tts_headsign: patternData.tts_headsign,
					});
				}
			}
		}
		// Return the timetable data, sorted by scheduled arrival time
		return timetableDataForSelectedDate.sort((a, b) => a.arrival_effective_ms - b.arrival_effective_ms);
	}, [operationalDate.isTodaySelected, operationalDate.selectedOperationalDate, stopEtas, stopId, validPatternsData]);

	//
	// D. Handle actions

	const setActiveTripId = useCallback((tripId: string, stopSequence: number) => {
		const activePattern = validPatternsData?.find(patternGroup => patternGroup.trips.find(trip => trip.trip_ids.includes(tripId)));
		if (activePattern) setHighlightedPattern(activePattern);
		setHighlightedTripId(tripId);
		setHighlightedStopSequence(stopSequence);
	}, [validPatternsData]);

	const resetActiveTripId = useCallback(() => {
		setHighlightedPattern(undefined);
		setHighlightedTripId(undefined);
		setHighlightedStopSequence(undefined);
	}, []);

	//
	// E. Define context value

	const contextValue = useMemo<StopsDetailContextState>(() => ({
		actions: {
			resetActiveTripId,
			setActiveTripId,
		},
		data: {
			active_alerts: activeAlertsData,
			associated_lines: associatedLinesData,
			highlighted_pattern: highlightedPattern,
			highlighted_stop_sequence: highlightedStopSequence,
			highlighted_trip_id: highlightedTripId,
			stop: selectedStopData,
			timetable: timetableDataForSelectedDate,
		},
		flags: {
			is_loading: isLoading || isStopsLoading || isLinesLoading,
		},
	}), [activeAlertsData, associatedLinesData, highlightedPattern, highlightedStopSequence, highlightedTripId, isLinesLoading, isLoading, isStopsLoading, resetActiveTripId, selectedStopData, setActiveTripId, timetableDataForSelectedDate]);

	//
	// F. Render components

	return (
		<StopsDetailContext.Provider value={contextValue}>
			{children}
		</StopsDetailContext.Provider>
	);

	//
};
