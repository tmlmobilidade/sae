import { getAllAlerts } from '@/actions/alerts';
import { Alert } from '@tmlmobilidade/services/types';
import { DateTime } from 'luxon';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface AlertsListState {
	actions: {
		fetchAlerts: () => void
		setSelected: (alert: Alert) => void
		updateFilterByDate: (value: string) => void
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
		by_date: null | string
		line_id: null | string
		search: null | string
		stop_id: null | string
	}
	flags: {
		isLoading: boolean
	}
}

export const useAlertsListStore = create<AlertsListState>()(subscribeWithSelector(set => ({
	actions: {
		fetchAlerts: async () => {
			set(() => ({ flags: { isLoading: true } }));

			const alerts = await getAllAlerts();

			set(state => ({ data: { ...state.data, filtered: filterAlerts(alerts, state.filters), raw: alerts } }));
			set(state => ({ data: { ...state.data, selected: alerts[0] } }));

			set(() => ({ flags: { isLoading: false } }));
		},
		setSelected: (alert: Alert) => {
			set(state => ({ data: { ...state.data, selected: alert } }));
		},
		updateFilterByDate: (value: string) => {
			set(state => ({ filters: { ...state.filters, by_date: value } }));
		},
		updateFilterByLineId: (value: string) => {
			set(state => ({ filters: { ...state.filters, line_id: value } }));
		},
		updateFilterBySearchQuery: (value: string) => {
			set(state => ({ filters: { ...state.filters, search: value } }));
		},
		updateFilterByStopId: (value: string) => {
			set(state => ({ filters: { ...state.filters, stop_id: value } }));
		},
	},
	data: {
		filtered: [],
		raw: [],
		selected: null,
	},
	filters: {
		by_date: null,
		line_id: null,
		search: null,
		stop_id: null,
	},
	flags: {
		isLoading: false,
	},
})));

function filterAlerts(alerts: Alert[], filters: AlertsListState['filters']): Alert[] {
	let filterResult: Alert[] = alerts;

	//
	// Filter by_date
	const nowInUnixSeconds = DateTime.now().startOf('day').toSeconds();
	const oneWeekFromNowInUnixSeconds = DateTime.now().plus({ week: 1 }).endOf('day').toSeconds();

	filterResult = filterResult.filter((item) => {
		const alertStartDateInSeconds = DateTime.fromJSDate(item.active_period_start_date).toSeconds();
		const alertEndDate = DateTime.fromJSDate(item.active_period_end_date).toSeconds();
		//
		if (filters.by_date === 'current') {
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

	if (filters.line_id) {
		filterResult = filterResult.filter(alert => alert.line_ids.some(lineId => lineId === filters.line_id));
	}

	if (filters.stop_id) {
		filterResult = filterResult.filter(alert => alert.stop_ids.some(stopId => stopId === filters.stop_id));
	}

	filterResult = filterResult.filter((alert) => {
		if (!filters.search) return true;

		const searchQuery = filters.search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		return (
			alert.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(searchQuery)
			|| alert.description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(searchQuery)
		);
	});

	return filterResult;
}

useAlertsListStore.subscribe(state => state.filters, (filters, prevFilters) => {
	const setState = useAlertsListStore.setState;

	if (filters !== prevFilters) {
		const filtered = filterAlerts(useAlertsListStore.getState().data.raw, filters);
		console.log('filtered', filtered);
		setState(state => ({ data: { ...state.data, filtered } }));
	}
}, { fireImmediately: true });

useAlertsListStore.getState().actions.fetchAlerts();
