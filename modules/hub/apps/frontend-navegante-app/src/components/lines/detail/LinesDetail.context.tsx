'use client';

import { useAlertsData } from '@/components/alerts/use-alerts-data';
import { useLinesData } from '@/components/lines/use-lines-data';
import { useRoutesData } from '@/components/lines/use-routes-data';
import { useStopsData } from '@/components/stops/use-stops-data';
import { useOperationalDate } from '@/hooks/transit/useOperationalDate';
import { API_ROUTES } from '@tmlmobilidade/consts';
import { type HubAlert, type HubLine, type HubPattern, type HubRoute, type HubShape, type HubWaypoint } from '@tmlmobilidade/go-types-hub';
import { type OperationalDateInt } from '@tmlmobilidade/go-types-shared';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/* * */

interface LinesDetailContextState {
	actions: {
		setActivePattern: (patternGroupId: string) => void
		setActiveWaypoint: (stopId: string, stopSequence: number) => void
		setHighlightedTripIds: (tripIds: string[]) => void
	}
	data: {
		active_alerts: HubAlert[] | undefined
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

	const { data: alerts } = useAlertsData();
	const { data: lines, isLoading: isLinesLoading } = useLinesData();
	const { data: routes, isLoading: isRoutesLoading } = useRoutesData();
	const { data: stops, isLoading: isStopsLoading } = useStopsData();

	const { selectedOperationalDate } = useOperationalDate();

	const [dataAllPatternsState, setDataAllPatternsState] = useState<LinesDetailContextState['data']['all_patterns']>(null);
	const [dataValidPatternsState, setDataValidPatternsState] = useState<LinesDetailContextState['data']['valid_patterns']>();
	const [dataActiveAlertsState, setDataActiveAlertsState] = useState<LinesDetailContextState['data']['active_alerts']>();
	const [dataActivePatternState, setDataActivePatternState] = useState<LinesDetailContextState['data']['active_pattern']>(null);
	const [dataActiveShapeState, setDataActiveShapeState] = useState<LinesDetailContextState['data']['active_shape']>(null);
	const [dataActiveWaypointState, setDataActiveWaypointState] = useState<LinesDetailContextState['data']['active_waypoint']>(null);
	const [dataHighlightedTripIdsState, setDataHighlightedTripIdsState] = useState<LinesDetailContextState['data']['highlighted_trip_ids']>([]);
	const [filterActivePatternIdState, setFilterActivePatternIdState] = useState<null | string>(null);
	const [filterActiveWaypointStopIdState, setFilterActiveWaypointStopIdState] = useState<null | string>(null);
	const [filterActiveWaypointStopSequenceState, setFilterActiveWaypointStopSequenceState] = useState<null | string>(null);

	const [flagIsInteractiveModeState, setFlagIsInteractiveModeState] = useState<LinesDetailContextState['flags']['is_interactive_mode']>(false);

	//
	// B. Fetch data

	const selectedLineData = useMemo(() => {
		if (!lineId) return;
		return lines.find(item => item._id === lineId);
	}, [lineId, lines]);

	const availableRoutesData = useMemo(() => {
		if (!selectedLineData?.route_ids?.length) return;
		return routes.filter(item => selectedLineData.route_ids.includes(item._id));
	}, [routes, selectedLineData?.route_ids]);

	useEffect(() => {
		setDataAllPatternsState(null);
		setDataValidPatternsState(undefined);
		setDataActiveAlertsState(undefined);
		setDataActivePatternState(null);
		setDataActiveShapeState(null);
		setDataActiveWaypointState(null);
		setDataHighlightedTripIdsState([]);
		setFilterActivePatternIdState(null);
		setFilterActiveWaypointStopIdState(null);
		setFilterActiveWaypointStopSequenceState(null);
		setFlagIsInteractiveModeState(false);
	}, [lineId]);

	useEffect(() => {
		let isCancelled = false;

		(async () => {
			try {
				if (!selectedLineData) return;
				const fetchPromises = selectedLineData.pattern_ids.map((patternId) => {
					return fetch(API_ROUTES.hub.NETWORK_PATTERNS(patternId))
						.then((response) => {
							if (!response.ok) throw new Error(`Failed to fetch pattern ${patternId}`);
							return response.json();
						})
						.then((patternPayload) => {
							const patternData = Array.isArray(patternPayload) ? patternPayload : patternPayload.data ?? [];
							return patternData.map((patternGroup) => {
								patternGroup.path = patternGroup.path.map((waypoint) => {
									const stopData = stops.find(stop => String(stop._id) === String(waypoint.stop_id));
									if (!stopData) return waypoint;
									return { ...waypoint, stop: stopData };
								});
								return patternGroup;
							});
						});
				});
				const resultData = await Promise.all(fetchPromises);
				if (!isCancelled) setDataAllPatternsState(resultData);
			} catch {
				if (!isCancelled) setDataAllPatternsState([]);
			}
		})();

		return () => {
			isCancelled = true;
		};
	}, [selectedLineData, stops]);

	/**
	 * TASK: Fetch shape data for the active pattern.
	 * WHEN: The `dataActivePatternState` changes.
	 */
	useEffect(() => {
		if (!dataActivePatternState) return;
		let isCancelled = false;

		(async () => {
			try {
				const shapeUrl = API_ROUTES.hub.NETWORK_SHAPES(dataActivePatternState.shape_id);
				const shapeData = await fetch(shapeUrl).then((response) => {
					if (!response.ok) throw new Error(`Failed to fetch shape ${dataActivePatternState.shape_id}`);
					return response.json();
				}).then(shapePayload => shapePayload?.data ?? shapePayload);
				if (shapeData) {
					shapeData.geojson = {
						...shapeData.geojson,
						properties: {
							color: dataActivePatternState.color,
							text_color: dataActivePatternState.text_color,
						},
					};
				}
				if (!isCancelled) setDataActiveShapeState(shapeData);
			} catch {
				if (!isCancelled) setDataActiveShapeState(null);
			}
		})();

		return () => {
			isCancelled = true;
		};
	}, [dataActivePatternState]);

	//
	// C. Transform data

	useEffect(() => {
		if (!dataAllPatternsState || !selectedOperationalDate) return;
		const activePatterns: HubPattern[] = [];
		for (const pattern of dataAllPatternsState) {
			let closestDateSoFar: null | OperationalDateInt = null;
			let patternGroupWithClosestDate: HubPattern | null = null;
			for (const patternGroup of pattern) {
				// Find the closest valid date
				const closestDate = patternGroup.valid_on.reduce<null | OperationalDateInt>((currentClosestDate, currentDate) => {
					if (selectedOperationalDate <= currentDate && (currentClosestDate === null || currentDate < currentClosestDate)) return currentDate;
					return currentClosestDate;
				}, null);
				if (closestDate !== null && (closestDateSoFar === null || closestDate <= closestDateSoFar)) {
					patternGroupWithClosestDate = patternGroup;
					closestDateSoFar = closestDate;
				}
			}
			// If the closest date is valid, add the pattern group to the list
			if (patternGroupWithClosestDate && !activePatterns.find(activePattern => activePattern._id === patternGroupWithClosestDate._id)) {
				activePatterns.push(patternGroupWithClosestDate);
			}
		}
		const sortedPatterns = activePatterns.sort((a, b) => a._id.localeCompare(b._id));
		setDataValidPatternsState(sortedPatterns);
	}, [dataAllPatternsState, selectedOperationalDate]);

	useEffect(() => {
		const activeAlerts = alerts.filter((row) => {
			if (!row.active_period_start_date && row.active_period_end_date) return false;
			return row.references.some((reference) => {
				const normalizedLineId = lineId?.trim();
				const lineAgencyId = selectedLineData?.agency_id?.trim();
				const informedAgencyId = reference.parent_id?.trim();

				if (informedAgencyId) {
					// Extract the agency id inside brackets, e.g. `[44]4403` -> `44`
					const informedBracketAgency = informedAgencyId.match(/^\[([^\]]+)\]/)?.[1] ?? informedAgencyId;
					const agencyOk = informedBracketAgency === lineAgencyId;
					if (!agencyOk) return false;
				}

				if (reference.parent_id != null) return reference.parent_id.trim() === normalizedLineId;

				if (reference.child_ids.length > 0) return selectedLineData?.route_ids?.includes(reference.child_ids[0]);

				if (reference.parent_id != null) {
					return dataAllPatternsState?.some(pattern => pattern.some(patternGroup => patternGroup.path.some(waypoint => waypoint.stop_id === reference.parent_id)));
				}

				return true;
			});
		});

		setDataActiveAlertsState(activeAlerts);
	}, [alerts, lineId, selectedLineData, dataAllPatternsState]);

	//
	// D. Handle actions

	/**
	 * Preselect a Pattern if there is no filter value.
	 * Return otherwise.
	 */
	useEffect(() => {
		// Return early if no patterns are available
		if (!dataValidPatternsState?.length) return;
		// Preselect the first pattern with a path, falling back to the first pattern
		if (!filterActivePatternIdState) {
			const firstWithPath = dataValidPatternsState.find(pattern => pattern.path.length > 0);
			setFilterActivePatternIdState(firstWithPath?._id);
			setFlagIsInteractiveModeState(false);
		}
	}, [dataValidPatternsState, filterActivePatternIdState]);

	/**
	 * Activate a given Pattern based on the filter value for active_pattern_id.
	 * This runs everytime the filter changes.
	 */
	useEffect(() => {
		// Return early if no patterns are available or no filter value for active_pattern_id
		if (!dataValidPatternsState || !filterActivePatternIdState) return;
		// If there is a filter value for active pattern, set the pattern with that ID
		const foundActivePatternData = dataValidPatternsState.find(activePattern => activePattern._id === filterActivePatternIdState);
		if (!foundActivePatternData) return;
		setDataActivePatternState(foundActivePatternData);
	}, [dataValidPatternsState, filterActivePatternIdState]);

	/**
	 * Preselect a Waypoint if there is no filter value.
	 * Return otherwise.
	 */
	useEffect(() => {
		// Return early if there is no active pattern
		if (!dataActivePatternState) return;
		// Preselect the first waypoint of the active pattern if there is no filter value
		if (!filterActiveWaypointStopIdState) {
			if (!dataActivePatternState.path.length) return;
			const firstStopId = dataActivePatternState.path[0].stop_id;
			const firstStopSequence = dataActivePatternState.path[0].stop_sequence;
			setFilterActiveWaypointStopIdState(firstStopId);
			setFilterActiveWaypointStopSequenceState(String(firstStopSequence));
			setFlagIsInteractiveModeState(false);
		}
	}, [dataActivePatternState, filterActiveWaypointStopIdState]);

	/**
	 * Activate a given Waypoint based on the filter value for active_stop_id and active_stop_sequence.
	 * This runs everytime the filter changes.
	 */
	useEffect(() => {
		// Return early if no patterns are available or no filter value for active_stop_id and active_stop_sequence
		if (!dataActivePatternState || !filterActiveWaypointStopIdState) return;
		// If there is a filter value for active_stop_id AND active_stop_sequence, then set the waypoint with that id AND sequence
		if (filterActiveWaypointStopIdState && filterActiveWaypointStopSequenceState) {
			const foundWaypointData = dataActivePatternState.path.find(waypoint => waypoint.stop_id === filterActiveWaypointStopIdState && waypoint.stop_sequence === Number(filterActiveWaypointStopSequenceState));
			if (foundWaypointData) {
				setDataActiveWaypointState(foundWaypointData);
				setFilterActiveWaypointStopIdState(foundWaypointData.stop_id);
				setFilterActiveWaypointStopSequenceState(String(foundWaypointData.stop_sequence));
				return;
			}
		}
		// We purposely do not try to match only by stop_id or stop_sequence since it probably will not make sense to the user.
		// The first stop of the pattern _0 is completely different from the first stop of the pattern _1, but matches the stop_id.
		// In this case, we should reset the filter values and the active waypoint.
		setDataActiveWaypointState(null);
		setFilterActiveWaypointStopIdState(null);
		setFilterActiveWaypointStopSequenceState(null);
		//
	}, [dataActivePatternState, filterActiveWaypointStopIdState, filterActiveWaypointStopSequenceState, setFilterActiveWaypointStopIdState, setFilterActiveWaypointStopSequenceState]);

	/**
	 * Set the active pattern based on the pattern version id.
	 * @param patternVersionId
	 * @returns
	 */
	const setActivePattern = useCallback((patternVersionId: string) => {
		// Return early if there are no valid patterns
		if (!dataValidPatternsState) return;
		// Find the pattern data that matches the pattern version id
		const foundPatternData = dataValidPatternsState.find(validPattern => validPattern.version_id === patternVersionId);
		// Update the state
		if (foundPatternData) {
			setFilterActivePatternIdState(foundPatternData._id);
			setFlagIsInteractiveModeState(false);
		}
	}, [dataValidPatternsState]);

	/**
	 * Set the active waypoint based on the stop id and stop sequence.
	 * Optionally reset the interactive mode.
	 * @param stopId
	 * @param stopSequence
	 * @param isInteractive
	 * @returns
	 */
	const setActiveWaypoint = useCallback((stopId: string, stopSequence: number, isInteractive = true) => {
		// Return early if active waypoint is already selected
		if (dataActiveWaypointState?.stop_id === stopId && dataActiveWaypointState?.stop_sequence === stopSequence) return;
		// Find the waypoint in the active pattern that matches the stop id and stop sequence
		const foundWaypoint = dataActivePatternState?.path.find(waypoint => waypoint.stop_id === stopId && waypoint.stop_sequence === stopSequence);
		// Update the state
		if (foundWaypoint) {
			setFilterActiveWaypointStopIdState(foundWaypoint.stop_id);
			setFilterActiveWaypointStopSequenceState(String(foundWaypoint.stop_sequence));
			setFlagIsInteractiveModeState(isInteractive);
		}
	}, [dataActivePatternState, dataActiveWaypointState]);

	/**
	 * Set the highlighted trip ids.
	 * @param tripIds
	 * @returns
	 */
	const setHighlightedTripIds = useCallback((tripIds: string[]) => {
		if (tripIds === dataHighlightedTripIdsState) setDataHighlightedTripIdsState(null);
		else setDataHighlightedTripIdsState(tripIds);
	}, [dataHighlightedTripIdsState]);

	//
	// E. Define context value

	const contextValue = useMemo<LinesDetailContextState>(() => ({
		actions: {
			setActivePattern,
			setActiveWaypoint,
			setHighlightedTripIds,
		},
		data: {
			active_alerts: dataActiveAlertsState,
			active_pattern: dataActivePatternState,
			active_shape: dataActiveShapeState,
			active_waypoint: dataActiveWaypointState,
			all_patterns: dataAllPatternsState,
			highlighted_trip_ids: dataHighlightedTripIdsState,
			line: selectedLineData,
			routes: availableRoutesData,
			valid_patterns: dataValidPatternsState,
		},
		filters: {
			active_pattern_id: filterActivePatternIdState,
			active_waypoint_stop_id: filterActiveWaypointStopIdState,
			active_waypoint_stop_sequence: filterActiveWaypointStopSequenceState,
		},
		flags: {
			is_interactive_mode: flagIsInteractiveModeState,
			is_loading: isLinesLoading || isRoutesLoading || isStopsLoading || availableRoutesData === null || dataAllPatternsState === null,
		},
	}), [availableRoutesData, dataActiveAlertsState, dataActivePatternState, dataActiveShapeState, dataActiveWaypointState, dataAllPatternsState, dataHighlightedTripIdsState, dataValidPatternsState, filterActivePatternIdState, filterActiveWaypointStopIdState, filterActiveWaypointStopSequenceState, flagIsInteractiveModeState, isLinesLoading, isRoutesLoading, isStopsLoading, selectedLineData, setActivePattern, setActiveWaypoint, setHighlightedTripIds]);

	//
	// F. Render components

	return (
		<LinesDetailContext.Provider value={contextValue}>
			{children}
		</LinesDetailContext.Provider>
	);

	//
};
