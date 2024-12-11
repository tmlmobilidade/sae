'use client';

import { Alert } from '@tmlmobilidade/services/types';
/* * */

import { useQueryState } from 'nuqs';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/* * */

interface AlertsListContextState {
	actions: {
		setSelected: (alert: Alert | null) => void
		updateFilterByLineId: (value: string) => void
		updateFilterBySearchQuery: (value: string) => void
		updateFilterByStopId: (value: string) => void
	}
	data: {
		filtered: Alert[]
		raw: Alert[]
		selected: Alert | null
	}
	filters: {
		line_id: null | string
		search_query: null | string
		stop_id: null | string
	}
	flags: {
		is_loading: boolean
	}
}

/* * */

const AlertsListContext = createContext<AlertsListContextState | undefined>(undefined);

export function useAlertsListContext() {
	const context = useContext(AlertsListContext);
	if (!context) {
		throw new Error('useAlertsListContext must be used within a AlertsListContextProvider');
	}
	return context;
}

/* * */

export const AlertsListContextProvider = ({ alertsData, children }: { alertsData: Alert[], children: React.ReactNode }) => {
	//
	// A. Setup variables

	const [dataFilteredState, setDataFilteredState] = useState<Alert[]>([]);

	const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
	const [selectedAlertId, setSelectedAlertId] = useQueryState('alert_id');

	const [filterByLineIdState, setFilterByLineIdState] = useQueryState('line_id');
	const [filterBySearchQueryState, setFilterBySearchQueryState] = useQueryState('q');
	const [filterByStopIdState, setFilterByStopIdState] = useQueryState('stop_id');

	const [isLoading] = useState(false);

	//
	// B. Fetch data

	const allAlertsData = useMemo(() => alertsData, [alertsData]);

	//
	// C. Transform data

	const applyFiltersToData = (alertsData: Alert[]) => {
		//

		let filterResult: Alert[] = alertsData || [];

		if (filterBySearchQueryState) {
			filterResult = filterResult.filter((alert) => {
				const searchQuery = filterBySearchQueryState.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
				return (
					alert.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(searchQuery)
					|| alert.description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(searchQuery)
				);
			});
		}

		//
		// Save filter result to state

		return filterResult;
	};

	useEffect(() => {
		const filteredAlerts = applyFiltersToData(allAlertsData);
		setDataFilteredState(filteredAlerts);
	}, [allAlertsData, filterByLineIdState, filterBySearchQueryState, filterByStopIdState]);

	useEffect(() => {
		setSelectedAlert(dataFilteredState.find(alert => alert._id?.toString() === selectedAlertId) || null);
	}, [selectedAlertId, dataFilteredState]);

	//
	// D. Handle actions

	const updateFilterByLineId = (value: AlertsListContextState['filters']['line_id']) => {
		setFilterByLineIdState(value);
	};

	const updateFilterByStopId = (value: AlertsListContextState['filters']['stop_id']) => {
		setFilterByStopIdState(value);
	};

	const updateFilterBySearchQuery = (value: AlertsListContextState['filters']['search_query']) => {
		setFilterBySearchQueryState(value);
	};

	const setSelected = (alert: Alert | null) => {
		setSelectedAlertId(alert?._id?.toString() || null);
	};

	//
	// E. Define context value

	const contextValue: AlertsListContextState = {
		actions: {
			setSelected,
			updateFilterByLineId,
			updateFilterBySearchQuery,
			updateFilterByStopId,
		},
		data: {
			filtered: dataFilteredState,
			raw: allAlertsData || [],
			selected: selectedAlert,
		},
		filters: {
			line_id: filterByLineIdState,
			search_query: filterBySearchQueryState,
			stop_id: filterByStopIdState,
		},
		flags: {
			is_loading: isLoading,
		},
	};

	//
	// F. Render components

	return (
		<AlertsListContext.Provider value={contextValue}>
			{children}
		</AlertsListContext.Provider>
	);

	//
};
