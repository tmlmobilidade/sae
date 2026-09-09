'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type PlansAgencyItem } from '@tmlmobilidade/go-operation-pckg-types';
import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { fetchApiData, SelectDataItem } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

interface PlansAgenciesDataReturnType {
	data: PlansAgencyItem[]
	error: null | string
	ids: string[]
	isLoading: boolean
	options: SelectDataItem[]
	timestamp: null | UnixMilliseconds
}

/**
 * Hook to fetch agencies data. Useful for supplying data
 * to filters or select components.
 * @returns An object containing the agencies data.
 */
export function usePlansAgenciesData(): PlansAgenciesDataReturnType {
	//

	//
	// A. Fetch data

	const { data, error, isLoading, isValidating } = useSWR(API_ROUTES.operation.PLANS_LIST_AGENCIES, {
		fetcher: async (url: string) => await fetchApiData<PlansAgencyItem[]>({ method: 'GET', url: url }),
		refreshInterval: 300_000, // 5 minutes
	});

	//
	// C. Transform data

	const idsData = useMemo(() => {
		// Skip if no data is available
		if (!data?.data?.length) return [];
		// Map data to array of IDs
		return data.data.map(item => item._id);
	}, [data?.data]);

	const optionsData = useMemo(() => {
		// Skip if no data is available
		if (!data?.data?.length) return [];
		// Map data to SelectDataItem format
		return data.data.map((item): SelectDataItem => ({
			checked: false,
			disabled: false,
			label: `[${item._id}] ${item.code} - ${item.name}`,
			value: item._id,
		}));
	}, [data?.data]);

	//
	// D. Return value

	return useMemo(() => ({
		data: data?.data,
		error: error?.error,
		ids: idsData,
		isLoading,
		options: optionsData,
		timestamp: data?.timestamp ?? null,
	}), [data?.data, error?.error, idsData, isLoading, isValidating, optionsData, data?.timestamp]);
};
