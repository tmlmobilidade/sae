'use client';

import { getAvailableLines, getAvailableStops } from '@/lib/alert-utils';
import { swrFetcher } from '@/lib/http';
import { Routes } from '@/lib/routes';
import { toggleArray } from '@/lib/utils';
import { Alert, AlertSchema } from '@tmlmobilidade/core-types';
import { useSearchQuery } from '@tmlmobilidade/ui';
import { DateTime } from 'luxon';
import { createContext, useContext, useMemo, useState } from 'react';
import useSWR from 'swr';

import { useLinesContext } from './Lines.context';
import { useLocationsContext } from './Locations.context';
import { useStopsContext } from './Stops.context';

interface AlertListContextState {
	actions: {
		changePublishDateEnd: (date: Date | null) => void
		changePublishDateStart: (date: Date | null) => void
		changeSearchQuery: (query: string) => void
		changeValidityDateEnd: (date: Date | null) => void
		changeValidityDateStart: (date: Date | null) => void
		toggleCause: (cause: string) => void
		toggleEffect: (effect: string) => void
		toggleLine: (line: string) => void
		toggleMunicipality: (municipality: string) => void
		togglePublishStatus: (status: string) => void
		toggleStop: (stop: string) => void
	}
	data: {
		filtered: Alert[]
		raw: Alert[]
	}
	filters: {
		cause: string[]
		effect: string[]
		line: string[]
		lineOptions: string[]
		municipality: string[]
		municipalityOptions: string[]
		publish_status: string[]
		publishDateEnd: Date | null
		publishDateStart: Date | null
		searchQuery: string
		stop: string[]
		stopOptions: string[]
		validityDateEnd: Date | null
		validityDateStart: Date | null
	}
	flags: {
		error: Error | undefined
		isLoading: boolean
	}
}

const AlertListContext = createContext<AlertListContextState | undefined>(undefined);

export const useAlertListContext = () => {
	const context = useContext(AlertListContext);
	if (!context) {
		throw new Error('useAlertListContext must be used within an AlertListContextProvider');
	}
	return context;
};

export const AlertListContextProvider = ({ children }: { children: React.ReactNode }) => {
	//

	//
	// A. Fetch data
	const { data: { municipalities } } = useLocationsContext();
	const { data: { routes } } = useLinesContext();
	const { data: { stops } } = useStopsContext();

	const { data: allAlertsData, error: allAlertsError, isLoading: allAlertsLoading } = useSWR<Alert[], Error>(`${Routes.ALERTS_API}/alerts`, swrFetcher);
	const rawAlerts = useMemo(() => allAlertsData || [], [allAlertsData]);

	const [filterPublishStatus, setFilterPublishStatus] = useState<string[]>(AlertSchema.shape.publish_status.options);
	const [filterCause, setFilterCause] = useState<string[]>(AlertSchema.shape.cause.options);
	const [filterEffect, setFilterEffect] = useState<string[]>(AlertSchema.shape.effect.options);
	const [filterMunicipality, setFilterMunicipality] = useState<string[]>([]);
	const [filterLine, setFilterLine] = useState<string[]>([]);
	const [filterStop, setFilterStop] = useState<string[]>([]);
	const [filterValidityDateStart, setFilterValidityDateStart] = useState<Date | null>(null);
	const [filterValidityDateEnd, setFilterValidityDateEnd] = useState<Date | null>(null);
	const [filterPublishDateStart, setFilterPublishDateStart] = useState<Date | null>(null);
	const [filterPublishDateEnd, setFilterPublishDateEnd] = useState<Date | null>(null);

	//
	// B. Transform data
	const municipalityOptions = useMemo(() => {
		const options = new Set<string>();
		rawAlerts.forEach((alert) => {
			alert.municipality_ids.forEach((id) => {
				const municipality = municipalities.find(m => m.id === id);
				if (municipality) {
					options.add(municipality.id);
				}
			});
		});
		setFilterMunicipality(Array.from(options));
		return Array.from(options);
	}, [rawAlerts]);

	const lineOptions = useMemo(() => {
		const options = new Set<string>();

		rawAlerts.forEach((alert) => {
			getAvailableLines(alert).forEach((route_id) => {
				const route = routes.find(r => r.id === route_id);
				if (route) {
					options.add(route.id);
				}
			});
		});

		setFilterLine(Array.from(options));
		return Array.from(options);
	}, [rawAlerts]);

	const stopOptions = useMemo(() => {
		const options = new Set<string>();

		rawAlerts.forEach((alert) => {
			getAvailableStops(alert).forEach((stop_id) => {
				const stop = stops.find(s => s.id === stop_id);
				if (stop) {
					options.add(stop.id);
				}
			});
		});

		setFilterStop(Array.from(options));
		return Array.from(options);
	}, [rawAlerts]);

	// Use the useSearchQuery hook
	const { filteredData: searchFilteredAlerts, searchQuery, setSearchQuery } = useSearchQuery(rawAlerts, {
		accessors: ['title', 'description', 'cause', 'effect', 'municipality_ids'],
		customSearch: (alert, query) => {
			// Check if any municipality name matches the query
			const municipalityMatch = alert.municipality_ids.some((id) => {
				const municipality = municipalities.find(m => m.id === id);
				return municipality?.name.toLowerCase().includes(query);
			});

			// Check if any stop name matches the query
			const stopMatch = getAvailableStops(alert).some((stop_id) => {
				const stop = stops.find(s => s.id === stop_id);
				return stop?.long_name.toLowerCase().includes(query);
			});

			const stopIdMatch = getAvailableStops(alert).some((stop_id) => {
				const stop = stops.find(s => s.id === stop_id);
				return stop?.id.toLowerCase().includes(query);
			});

			// Check if any line name matches the query
			const lineMatch = getAvailableLines(alert).some((route_id) => {
				const route = routes.find(r => r.id === route_id);
				return route?.long_name.toLowerCase().includes(query);
			});

			const lineIdMatch = getAvailableLines(alert).some((route_id) => {
				const route = routes.find(r => r.id === route_id);
				return route?.id.toLowerCase().includes(query);
			});

			return municipalityMatch || stopMatch || stopIdMatch || lineMatch || lineIdMatch;
		},
	});

	const filteredAlerts = useMemo(() => {
		let filtered = searchFilteredAlerts;

		// 1. Filter by publish status
		filtered = filterPublishStatus.length !== AlertSchema.shape.publish_status.options.length ? filtered.filter(alert => filterPublishStatus.includes(alert.publish_status)) : filtered;

		// 2. Filter by cause
		filtered = filterCause.length !== AlertSchema.shape.cause.options.length ? filtered.filter(alert => filterCause.includes(alert.cause)) : filtered;

		// 3. Filter by effect
		filtered = filterEffect.length !== AlertSchema.shape.effect.options.length ? filtered.filter(alert => filterEffect.includes(alert.effect)) : filtered;

		// 4. Filter by municipality
		filtered = filterMunicipality.length !== municipalityOptions.length ? filtered.filter(alert => filterMunicipality.some(municipality => alert.municipality_ids.includes(municipality))) : filtered;

		// // 5. Filter by line
		filtered = filterLine.length !== lineOptions.length ? filtered.filter(alert => filterLine.some(line => getAvailableLines(alert).includes(line))) : filtered;

		// // 6. Filter by stop
		filtered = filterStop.length !== stopOptions.length ? filtered.filter(alert => filterStop.some(stop => getAvailableStops(alert).includes(stop))) : filtered;

		// 7. Filter by publish date
		filtered = filterPublishDateStart || filterPublishDateEnd ? filtered.filter((alert) => {
			const alertPublishStartDate = DateTime.fromISO(alert.publish_start_date.toString()).toMillis();
			const alertPublishEndDate = DateTime.fromISO(alert.publish_end_date.toString()).toMillis();
			const filterPublishStartDate = filterPublishDateStart ? DateTime.fromJSDate(filterPublishDateStart).toMillis() : null;
			const filterPublishEndDate = filterPublishDateEnd ? DateTime.fromJSDate(filterPublishDateEnd).toMillis() : null;

			if (filterPublishStartDate && filterPublishEndDate) {
				return alertPublishStartDate >= filterPublishStartDate && alertPublishEndDate <= filterPublishEndDate;
			}
			else if (filterPublishStartDate) {
				return alertPublishStartDate >= filterPublishStartDate;
			}
			else if (filterPublishEndDate) {
				return alertPublishEndDate <= filterPublishEndDate;
			}

			return true;
		}) : filtered;

		// 8. Filter by validity date
		filtered = filterValidityDateStart || filterValidityDateEnd ? filtered.filter((alert) => {
			const alertValidityStartDate = DateTime.fromISO(alert.active_period_start_date.toString()).toMillis();
			const alertValidityEndDate = DateTime.fromISO(alert.active_period_end_date.toString()).toMillis();
			const filterValidityStartDate = filterValidityDateStart ? DateTime.fromJSDate(filterValidityDateStart).toMillis() : null;
			const filterValidityEndDate = filterValidityDateEnd ? DateTime.fromJSDate(filterValidityDateEnd).toMillis() : null;

			if (filterValidityStartDate && filterValidityEndDate) {
				return alertValidityStartDate >= filterValidityStartDate && alertValidityEndDate <= filterValidityEndDate;
			}
			else if (filterValidityStartDate) {
				return alertValidityStartDate >= filterValidityStartDate;
			}
			else if (filterValidityEndDate) {
				return alertValidityEndDate <= filterValidityEndDate;
			}

			return true;
		}) : filtered;

		return filtered;
	}, [
		searchFilteredAlerts,
		filterPublishStatus,
		filterCause,
		filterEffect,
		filterMunicipality,
		filterLine,
		filterStop,
		filterValidityDateStart,
		filterValidityDateEnd,
		filterPublishDateStart,
		filterPublishDateEnd,
	]);

	//
	// C. Handle Actions

	function handleTogglePublishStatus(status: string) {
		setFilterPublishStatus(toggleArray(filterPublishStatus, status));
	}

	function handleToggleCause(cause: string) {
		setFilterCause(toggleArray(filterCause, cause));
	}

	function handleToggleEffect(effect: string) {
		setFilterEffect(toggleArray(filterEffect, effect));
	}

	function handleToggleMunicipality(municipality: string) {
		setFilterMunicipality(toggleArray(filterMunicipality, municipality));
	}

	function handleToggleLine(route_id: string) {
		setFilterLine(toggleArray(filterLine, route_id));
	}

	function handleToggleStop(stop_id: string) {
		setFilterStop(toggleArray(filterStop, stop_id));
	}

	function handleChangeValidityDateStart(date: Date | null) {
		setFilterValidityDateStart(date);
	}

	function handleChangeValidityDateEnd(date: Date | null) {
		setFilterValidityDateEnd(date);
	}

	function handleChangePublishDateStart(date: Date | null) {
		setFilterPublishDateStart(date);
	}

	function handleChangePublishDateEnd(date: Date | null) {
		setFilterPublishDateEnd(date);
	}

	//
	// D. Define context value

	const contextValue: AlertListContextState = useMemo(() => ({
		actions: {
			changePublishDateEnd: handleChangePublishDateEnd,
			changePublishDateStart: handleChangePublishDateStart,
			changeSearchQuery: setSearchQuery,
			changeValidityDateEnd: handleChangeValidityDateEnd,
			changeValidityDateStart: handleChangeValidityDateStart,
			toggleCause: handleToggleCause,
			toggleEffect: handleToggleEffect,
			toggleLine: handleToggleLine,
			toggleMunicipality: handleToggleMunicipality,
			togglePublishStatus: handleTogglePublishStatus,
			toggleStop: handleToggleStop,
		},
		data: {
			filtered: filteredAlerts || [],
			raw: rawAlerts || [],
		},
		filters: {
			cause: filterCause,
			effect: filterEffect,
			line: filterLine,
			lineOptions: lineOptions,
			municipality: filterMunicipality,
			municipalityOptions: municipalityOptions,
			publish_status: filterPublishStatus,
			publishDateEnd: filterPublishDateEnd,
			publishDateStart: filterPublishDateStart,
			searchQuery: searchQuery || '',
			stop: filterStop,
			stopOptions: stopOptions,
			validityDateEnd: filterValidityDateEnd,
			validityDateStart: filterValidityDateStart,
		},
		flags: {
			error: allAlertsError,
			isLoading: allAlertsLoading,
		},
	}), [
		rawAlerts,
		filteredAlerts,
		allAlertsData,
		allAlertsLoading,
		allAlertsError,
		filterPublishStatus,
		filterCause,
		filterEffect,
		filterMunicipality,
		municipalityOptions,
		filterLine,
		lineOptions,
		filterStop,
		stopOptions,
		filterValidityDateStart,
		filterValidityDateEnd,
		filterPublishDateStart,
		filterPublishDateEnd,
		searchQuery,
	]);

	//
	// E. Render components

	return (
		<AlertListContext.Provider value={contextValue}>
			{children}
		</AlertListContext.Provider>
	);

	//
};
