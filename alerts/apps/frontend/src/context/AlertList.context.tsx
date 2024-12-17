'use client';

import { getAllAlerts } from '@/actions/alerts';
import { Alert } from '@tmlmobilidade/services/types';
/* * */

import { useQueryState } from 'nuqs';
import { createContext, useContext, useEffect, useState } from 'react';
import useSWR from 'swr';

/* * */

interface AlertsListContextState {
	actions: {
		refresh: () => void
		addAlert: () => void
		setSelected: (alert: Alert | null) => void
		setSelectedId: (id: string) => void
		updateAlert: (alert: Alert) => void
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

export const AlertsListContextProvider = ({ children }: { children: React.ReactNode }) => {
	//
	// A. Setup variables

	const [dataFilteredState, setDataFilteredState] = useState<Alert[]>([]);
	const [dataRawState, setDataRawState] = useState<Alert[]>([]);

	const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
	const [selectedAlertId, setSelectedAlertId] = useQueryState('alert_id');

	const [filterByLineIdState, setFilterByLineIdState] = useQueryState('line_id');
	const [filterBySearchQueryState, setFilterBySearchQueryState] = useQueryState('q');
	const [filterByStopIdState, setFilterByStopIdState] = useQueryState('stop_id');

	const [isLoading] = useState(false);

	const { data: alertsData } = useSWR(process.env.NEXT_PUBLIC_API_ALERTS_URL + '/alerts', getAllAlerts);

	//
	// B. Fetch data

	useEffect(() => {
		if (!alertsData) return;
		setDataRawState(alertsData);

		// Initial filter application
		const filteredAlerts = applyFiltersToData(alertsData);
		setDataFilteredState(filteredAlerts);
	}, [alertsData]);

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
		const filteredAlerts = applyFiltersToData(dataRawState);
		setDataFilteredState(filteredAlerts);
	}, [dataRawState, filterByLineIdState, filterBySearchQueryState, filterByStopIdState]);

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

	const setSelectedId = (id: string) => {
		setSelectedAlertId(id);
	};

	const addAlert = () => {
		const emptyAlert: Alert = {
			_id: 'NEW_ALERT',
			active_period_end_date: new Date(),
			active_period_start_date: new Date(),
			cause: 'ACCIDENT',
			created_at: new Date(),
			description: '',
			effect: 'ACCESSIBILITY_ISSUE',
			image_url: undefined,
			municipality_ids: [],
			publish_end_date: new Date(),
			publish_start_date: new Date(),
			publish_status: 'UNPUBLISHED',
			reference_type: 'stop',
			references: [],
			title: '',
			updated_at: new Date(),
		};

		if (dataFilteredState.find(alert => alert._id?.toString() === emptyAlert._id?.toString())) {
			return;
		}

		// Add Empty Alert to dataFilteredState
		setDataFilteredState([...dataFilteredState, emptyAlert as Alert]);
		setSelected(emptyAlert as Alert);
	};

	const updateAlert = (alert: Alert) => {
		setDataRawState(dataRawState.map(a => a._id === alert._id ? alert : a));
	};

	const refresh = async () => {
		const alertsData = await getAllAlerts();
		setDataRawState(alertsData);
	};

	//
	// E. Define context value

	const contextValue: AlertsListContextState = {
		actions: {
			refresh,
			addAlert,
			setSelected,
			setSelectedId,
			updateAlert,
			updateFilterByLineId,
			updateFilterBySearchQuery,
			updateFilterByStopId,
		},
		data: {
			filtered: dataFilteredState,
			raw: dataRawState,
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
