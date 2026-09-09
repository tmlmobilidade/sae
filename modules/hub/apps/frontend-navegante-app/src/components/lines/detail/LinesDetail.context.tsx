'use client';

import { useLineDetailData } from '@/components/lines/detail/use-line-detail-data';
import { useLineDetailShapeData } from '@/components/lines/detail/use-line-detail-shape-data';
import { type HubAlert, type HubLine, type HubPattern, type HubRoute, type HubShape, type HubWaypoint } from '@tmlmobilidade/go-types-hub';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/* * */

interface LinesDetailContextState {
	actions: {
		setActivePattern: (patternGroupId: string) => void
		setActiveWaypoint: (stopId: string, stopSequence: number) => void
		setHighlightedTripIds: (tripIds: string[]) => void
	}
	data: {
		active_alerts: HubAlert[]
		active_pattern: HubPattern | null
		active_shape: HubShape | null
		active_waypoint: HubWaypoint | null
		all_patterns: HubPattern[][] | null
		highlighted_trip_ids: null | string[]
		line: HubLine | undefined
		routes: HubRoute[]
		valid_patterns: HubPattern[] | undefined
	}
	filters: {
		active_pattern_id: null | string
		active_waypoint_stop_id: null | string
		active_waypoint_stop_sequence: null | string
	}
	flags: {
		is_interactive_mode: boolean
		is_loading: boolean
	}
}

/* * */

const LinesDetailContext = createContext<LinesDetailContextState | undefined>(undefined);

export function useLinesDetailContext() {
	const context = useContext(LinesDetailContext);
	if (!context) {
		throw new Error('useLinesDetailContext must be used within a LinesDetailContextProvider');
	}
	return context;
}

/* * */

export function LinesDetailContextProvider({ children, lineId }: PropsWithChildren<{ lineId: null | string }>) {
	//

	//
	// A. Setup variables

	const [activePatternId, setActivePatternId] = useState<null | string>(null);
	const [activeWaypointStopId, setActiveWaypointStopId] = useState<null | string>(null);
	const [activeWaypointStopSequence, setActiveWaypointStopSequence] = useState<null | string>(null);
	const [highlightedTripIds, setHighlightedTripIdsState] = useState<null | string[]>([]);
	const [isInteractiveMode, setIsInteractiveMode] = useState(false);

	//
	// B. Fetch data

	const { activeAlerts, allPatterns, isLoading, line, routes, validPatterns } = useLineDetailData(lineId);

	//
	// C. Transform data

	const activePattern = useMemo(() => validPatterns?.find(pattern => pattern._id === activePatternId) ?? null, [activePatternId, validPatterns]);
	const activeShape = useLineDetailShapeData(activePattern);
	const activeWaypoint = useMemo(() => {
		if (!activePattern || !activeWaypointStopId || !activeWaypointStopSequence) return null;
		return activePattern.path.find(waypoint => waypoint.stop_id === activeWaypointStopId && waypoint.stop_sequence === Number(activeWaypointStopSequence)) ?? null;
	}, [activePattern, activeWaypointStopId, activeWaypointStopSequence]);

	//
	// D. Synchronize selected state

	// Reset interactions when navigating to a different line.
	useEffect(() => {
		setActivePatternId(null);
		setActiveWaypointStopId(null);
		setActiveWaypointStopSequence(null);
		setHighlightedTripIdsState([]);
		setIsInteractiveMode(false);
	}, [lineId]);

	// Select an initial pattern once line data is available.
	useEffect(() => {
		if (activePatternId || !validPatterns?.length) return;
		const firstPattern = validPatterns.find(pattern => pattern.path.length > 0) ?? validPatterns[0];
		setActivePatternId(firstPattern._id);
		setIsInteractiveMode(false);
	}, [activePatternId, validPatterns]);

	// Select the first waypoint when the active pattern has no selection.
	useEffect(() => {
		if (!activePattern || activeWaypointStopId) return;
		const firstWaypoint = activePattern.path[0];
		if (!firstWaypoint) return;
		setActiveWaypointStopId(firstWaypoint.stop_id);
		setActiveWaypointStopSequence(String(firstWaypoint.stop_sequence));
		setIsInteractiveMode(false);
	}, [activePattern, activeWaypointStopId]);

	// Clear a waypoint that no longer belongs to the active pattern.
	useEffect(() => {
		if (!activePattern || !activeWaypointStopId) return;
		if (activeWaypoint) return;
		setActiveWaypointStopId(null);
		setActiveWaypointStopSequence(null);
	}, [activePattern, activeWaypoint, activeWaypointStopId]);

	//
	// E. Handle actions

	const setActivePattern = useCallback((patternVersionId: string) => {
		const pattern = validPatterns?.find(candidate => candidate.version_id === patternVersionId);
		if (!pattern) return;
		setActivePatternId(pattern._id);
		setActiveWaypointStopId(null);
		setActiveWaypointStopSequence(null);
		setIsInteractiveMode(false);
	}, [validPatterns]);

	const setActiveWaypoint = useCallback((stopId: string, stopSequence: number, isInteractive = true) => {
		if (activeWaypoint?.stop_id === stopId && activeWaypoint.stop_sequence === stopSequence) return;
		const waypoint = activePattern?.path.find(candidate => candidate.stop_id === stopId && candidate.stop_sequence === stopSequence);
		if (!waypoint) return;
		setActiveWaypointStopId(waypoint.stop_id);
		setActiveWaypointStopSequence(String(waypoint.stop_sequence));
		setIsInteractiveMode(isInteractive);
	}, [activePattern, activeWaypoint]);

	const setHighlightedTripIds = useCallback((tripIds: string[]) => {
		if (tripIds === highlightedTripIds) setHighlightedTripIdsState(null);
		else setHighlightedTripIdsState(tripIds);
	}, [highlightedTripIds]);

	//
	// F. Define context value

	const contextValue = useMemo<LinesDetailContextState>(() => ({
		actions: {
			setActivePattern,
			setActiveWaypoint,
			setHighlightedTripIds,
		},
		data: {
			active_alerts: activeAlerts,
			active_pattern: activePattern,
			active_shape: activeShape,
			active_waypoint: activeWaypoint,
			all_patterns: allPatterns,
			highlighted_trip_ids: highlightedTripIds,
			line,
			routes,
			valid_patterns: validPatterns,
		},
		filters: {
			active_pattern_id: activePatternId,
			active_waypoint_stop_id: activeWaypointStopId,
			active_waypoint_stop_sequence: activeWaypointStopSequence,
		},
		flags: {
			is_interactive_mode: isInteractiveMode,
			is_loading: isLoading,
		},
	}), [activeAlerts, activePattern, activePatternId, activeShape, activeWaypoint, activeWaypointStopId, activeWaypointStopSequence, allPatterns, highlightedTripIds, isInteractiveMode, isLoading, line, routes, setActivePattern, setActiveWaypoint, setHighlightedTripIds, validPatterns]);

	//
	// G. Render components

	return (
		<LinesDetailContext.Provider value={contextValue}>
			{children}
		</LinesDetailContext.Provider>
	);

	//
}
