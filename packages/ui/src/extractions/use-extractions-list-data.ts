'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type Extraction } from '@tmlmobilidade/go-types-extractions';
import { type ApiResponse, type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { fetchApiData, useSearch } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

import { useExtractionsListFilterSearch } from './filters/ExtractionsListFilterSearch/use-extractions-list-filter-search';

/* * */

interface UseExtractionsListDataReturnType {
	data: Extraction[]
	error: null | string
	isLoading: boolean
	isValidating: boolean
	mutate: (data?: ApiResponse<Extraction[]>) => void
	timestamp: null | UnixMilliseconds
}

/* * */

export function useExtractionsListData(): UseExtractionsListDataReturnType {
	//

	//
	// A. Setup variables

	const filterSearch = useExtractionsListFilterSearch();

	//
	// B. Fetch data

	const { data, error, isLoading, isValidating, mutate } = useSWR(API_ROUTES.core.PLATFORM_EXTRACTIONS, {
		fetcher: async (url: string) => await fetchApiData<Extraction[]>({ url }),
		refreshInterval: 10_000, // 10 seconds
	});

	//
	// C. Transform data

	const searchResultsData = useSearch<Extraction>({
		accessors: ['_id'],
		data: data?.data,
		query: filterSearch.value,
	});

	//
	// D. Return data

	return useMemo(() => ({
		data: searchResultsData,
		error: error?.error,
		isLoading,
		isValidating,
		mutate,
		timestamp: data?.timestamp,
	}), [searchResultsData, data?.timestamp, error, isLoading, isValidating, mutate]);
};
