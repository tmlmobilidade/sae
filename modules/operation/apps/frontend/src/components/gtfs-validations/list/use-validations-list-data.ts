'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type ValidationListFilters, type ValidationListItem } from '@tmlmobilidade/go-operation-pckg-types';
import { type ApiResponse, ProcessingStatus, type UnixMilliseconds, ValidityStatus } from '@tmlmobilidade/go-types-shared';
import { fetchApiData, useSearch } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

import { useValidationsListFilterAgency } from './filters/ValidationsListFilterAgency/use-validations-list-filter-agency';
import { useValidationsListFilterProcessingStatus } from './filters/ValidationsListFilterProcessingStatus/use-validations-list-filter-processing-status';
import { useValidationsListFilterSearch } from './filters/ValidationsListFilterSearch/use-validations-list-filter-search';
import { useValidationsListFilterValidityStatus } from './filters/ValidationsListFilterValidityStatus/use-validations-list-filter-validity-status';

/* * */

interface UseValidationsListDataReturnType {
	data: ValidationListItem[]
	error: null | string
	isLoading: boolean
	isValidating: boolean
	mutate: () => void
	timestamp: null | UnixMilliseconds
}

/* * */

export function useValidationsListData(): UseValidationsListDataReturnType {
	//

	//
	// A. Setup variables

	const filterAgency = useValidationsListFilterAgency();
	const filterProcessingStatus = useValidationsListFilterProcessingStatus();
	const filterSearch = useValidationsListFilterSearch();
	const filterValidityStatus = useValidationsListFilterValidityStatus();

	// B. Transform data

	const query = useMemo<ValidationListFilters>(() => ({
		agency_ids: filterAgency.value,
		processing_statuses: filterProcessingStatus.value as ProcessingStatus[],
		search: filterSearch.value,
		validity_statuses: filterValidityStatus.value as ValidityStatus[],
	}), [filterAgency.value, filterProcessingStatus.value, filterSearch.value, filterValidityStatus.value]);

	//
	// C. Fetch data

	const { data, error, isLoading, isValidating, mutate } = useSWR<ApiResponse<ValidationListItem[]>>([API_ROUTES.operation.GTFS_VALIDATIONS_LIST, query], {
		fetcher: async ([url, query]) => await fetchApiData<ValidationListItem[]>({ body: query, method: 'POST', url }),
		refreshInterval: 10_000,
	});

	const searchResultData = useSearch<ValidationListItem>({
		accessors: ['_id'],
		data: data?.data ?? [],
		query: filterSearch.value,
	});

	//
	// D. Return data

	return useMemo(() => ({
		data: searchResultData,
		error: data?.error ?? (error instanceof Error ? error.message : null),
		isLoading,
		isValidating,
		mutate,
		timestamp: data?.timestamp ?? null,
	}), [searchResultData, data?.timestamp, error, isLoading, isValidating, mutate]);
}
