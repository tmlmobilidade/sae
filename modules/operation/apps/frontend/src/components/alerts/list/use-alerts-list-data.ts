'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type AlertsListFilters, type AlertsListItem } from '@tmlmobilidade/go-operation-pckg-types';
import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { fetchApiData, useSearch } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

import { useAlertsListFilterActivePeriod } from './filters/AlertsListFilterActivePeriod/use-alerts-list-filter-active-period';
import { useAlertsListFilterAgency } from './filters/AlertsListFilterAgency/use-alerts-list-filter-agency';
import { useAlertsListFilterCause } from './filters/AlertsListFilterCause/use-alerts-list-filter-cause';
import { useAlertsListFilterEffect } from './filters/AlertsListFilterEffect/use-alerts-list-filter-effect';
import { useAlertsListFilterPublishDate } from './filters/AlertsListFilterPublishDate/use-alerts-list-filter-publish-date';
import { useAlertsListFilterPublishStatus } from './filters/AlertsListFilterPublishStatus/use-alerts-list-filter-publish-status';
import { useAlertsListFilterReferenceType } from './filters/AlertsListFilterReferenceType/use-alerts-list-filter-reference-type';
import { useAlertsListFilterSearch } from './filters/AlertsListFilterSearch/use-alerts-list-filter-search';

/* * */

interface UseAlertsListDataReturnType {
	data: AlertsListItem[]
	error: null | string
	isLoading: boolean
	isValidating: boolean
	mutate: () => void
	timestamp: null | UnixMilliseconds
}

/* * */

export function useAlertsListData(): UseAlertsListDataReturnType {
	//

	//
	// A. Setup variables

	const filterAgency = useAlertsListFilterAgency();
	const filterReferenceType = useAlertsListFilterReferenceType();
	const filterPublishDate = useAlertsListFilterPublishDate();
	const filterPublishStatus = useAlertsListFilterPublishStatus();
	const filterActivePeriod = useAlertsListFilterActivePeriod();
	const filterCause = useAlertsListFilterCause();
	const filterEffect = useAlertsListFilterEffect();
	const filterSearch = useAlertsListFilterSearch();

	//
	// B. Transform data

	const query = useMemo<AlertsListFilters>(() => ({
		active_period_filter_end: filterActivePeriod.value_end,
		active_period_filter_start: filterActivePeriod.value_start,
		agency_ids: filterAgency.value,
		causes: filterCause.value,
		effects: filterEffect.value,
		publish_date_filter_end: filterPublishDate.value_end,
		publish_date_filter_start: filterPublishDate.value_start,
		publish_status: filterPublishStatus.value,
		reference_type: filterReferenceType.value,
	}), [filterAgency.value, filterPublishStatus.value, filterReferenceType.value, filterCause.value, filterEffect.value, filterActivePeriod.value_end, filterActivePeriod.value_start, filterPublishDate.value_end, filterPublishDate.value_start]);

	//
	// C. Fetch data

	const { data, error, isLoading, isValidating, mutate } = useSWR([API_ROUTES.operation.ALERTS_LIST, query], {
		fetcher: async ([url, query]) => await fetchApiData<AlertsListItem[]>({ body: query, method: 'POST', url }),
		refreshInterval: 10_000, // 10 seconds
	});

	//
	// D. Transform data

	const searchResultsData = useSearch<AlertsListItem>({
		accessors: ['_id', 'title'],
		data: data?.data,
		query: filterSearch.value,
	});

	//
	// E. Return data

	return useMemo(() => ({
		data: searchResultsData,
		error: error?.error,
		isLoading,
		isValidating,
		mutate,
		timestamp: data?.timestamp,
	}), [searchResultsData, data?.timestamp, error, isLoading, isValidating, mutate]);
};
