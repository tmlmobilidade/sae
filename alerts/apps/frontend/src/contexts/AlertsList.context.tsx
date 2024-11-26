'use client';

import { getAllAlerts } from '@/actions/alerts';
/* * */

import { Alert } from '@tmlmobilidade/services/types';
import { DateTime } from 'luxon';
import { useQueryState } from 'nuqs';
import { createContext, useContext, useEffect, useState } from 'react';
import useSWR from 'swr';

/* * */

interface AlertsListContextState {
	actions: {
		updateFilterByDate: (value: string) => void
		updateFilterByLineId: (value: string) => void
		updateFilterBySearchQuery: (value: string) => void
		updateFilterByStopId: (value: string) => void
	}
	counters: {
		by_date: {
			current: number
			future: number
		}
	}
	data: {
		filtered: Alert[]
		raw: Alert[]
	}
	filters: {
		by_date: 'current' | 'future'
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

export const AlertsListContextProvider = ({ children }) => {
	//

	//
	// A. Setup variables

	const [dataFilteredState, setDataFilteredState] = useState<Alert[]>([]);

	const [filterByDateState, setFilterByDateState] = useState <AlertsListContextState['filters']['by_date']>('current');
	const [filterByLineIdState, setFilterByLineIdState] = useQueryState('line_id');
	const [filterBySearchQueryState, setFilterBySearchQueryState] = useQueryState('search_query');
	const [filterByStopIdState, setFilterByStopIdState] = useQueryState('stop_id');

	const [isLoading, setIsLoading] = useState(false);

	const { data: alertsData, isLoading: isLoadingAlerts } = useSWR<Alert[], Error>('/api/alerts', getAllAlerts);

	//
	// C. Transform data

	// Set Counters
	const currentWeekAlerts = alertsData?.filter((item) => {
		const oneWeekFromNowInUnixSeconds = DateTime.now().plus({ week: 1 }).endOf('day').toSeconds();
		const nowInUnixSeconds = DateTime.now().startOf('day').toSeconds();
		const alertStartDateInSeconds = DateTime.fromJSDate(item.active_period_start_date).toSeconds();
		const alertEndDate = DateTime.fromJSDate(item.active_period_end_date).toSeconds();
		//
		if (alertStartDateInSeconds <= oneWeekFromNowInUnixSeconds && alertEndDate >= nowInUnixSeconds) {
			return true;
		}
		return false;
	}).length;

	const applyFiltersToData = () => {
		//

		let filterResult: Alert[] = alertsData || [];

		//
		// Filter by_date
		const nowInUnixSeconds = DateTime.now().startOf('day').toSeconds();
		const oneWeekFromNowInUnixSeconds = DateTime.now().plus({ week: 1 }).endOf('day').toSeconds();

		filterResult = filterResult.filter((item) => {
			const alertStartDateInSeconds = DateTime.fromJSDate(item.active_period_start_date).toSeconds();
			const alertEndDate = DateTime.fromJSDate(item.active_period_end_date).toSeconds();
			//
			if (filterByDateState === 'current') {
				// If the alert start date is before one week from now, and if the end date is after or equal to today
				// then the alert is considered 'current'.
				if (alertStartDateInSeconds <= oneWeekFromNowInUnixSeconds && alertEndDate >= nowInUnixSeconds) {
					return true;
				}
				return false;
			}
			else {
				// If the alert start date is before one week from now, and if the end date is after or equal to today
				// then the alert is considered 'current'.
				if (alertStartDateInSeconds <= oneWeekFromNowInUnixSeconds && alertEndDate >= nowInUnixSeconds) {
					return false;
				}
				return true;
			}
		});

		if (filterByLineIdState) {
			filterResult = filterResult.filter(alert => alert.line_ids.some(lineId => lineId === filterByLineIdState));
		}

		if (filterByStopIdState) {
			filterResult = filterResult.filter(alert => alert.stop_ids.some(stopId => stopId === filterByStopIdState));
		}

		// TODO: municipalityId does not exist in the informed_entity, needs to be added in API
		// if (filterByMunicipalityIdState) {
		// 	filterResult = filterResult.filter(alert => alert.informed_entity.some(entity => entity.municipalityId === filterByMunicipalityIdState));
		// }

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

		//
	};

	useEffect(() => {
		console.log('+++++ this is happening +++++');
		const filteredAlerts = applyFiltersToData();
		setDataFilteredState(filteredAlerts);
	}, [alertsData, filterByDateState, filterByLineIdState, filterBySearchQueryState, filterByStopIdState]);

	//
	// D. Handle actions

	const updateFilterByDate = (value: AlertsListContextState['filters']['by_date']) => {
		setFilterByDateState(value);
	};

	const updateFilterByLineId = (value: AlertsListContextState['filters']['line_id']) => {
		setFilterByLineIdState(value);
	};

	const updateFilterByStopId = (value: AlertsListContextState['filters']['stop_id']) => {
		setFilterByStopIdState(value);
	};

	const updateFilterBySearchQuery = (value: AlertsListContextState['filters']['search_query']) => {
		setFilterBySearchQueryState(value);
	};

	//
	// E. Define context value

	const contextValue: AlertsListContextState = {
		actions: {
			updateFilterByDate,
			updateFilterByLineId,
			updateFilterBySearchQuery,
			updateFilterByStopId,
		},
		counters: {
			by_date: {
				current: currentWeekAlerts || 0,
				future: (alertsData?.length || 0) - (currentWeekAlerts || 0),
			},
		},
		data: {
			filtered: dataFilteredState,
			raw: alertsData || [],
		},
		filters: {
			by_date: filterByDateState,
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
};
