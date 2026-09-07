'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type PlansStopsItem, type PlansStopsRequest } from '@tmlmobilidade/go-operation-pckg-types';
import { type ApiResponse, type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { fetchApiData, type SelectDataItem } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

interface UsePlansStopsReturnType {
	data: PlansStopsItem[]
	error: null | string
	ids: string[]
	isLoading: boolean
	options: SelectDataItem[]
	timestamp: null | UnixMilliseconds
}

/**
 * Fetch stops available to Plans poster exports for the selected agency.
 */
export function usePlansStops(query: null | PlansStopsRequest): UsePlansStopsReturnType {
	//

	//
	// A. Fetch data

	const { data, error, isLoading, isValidating } = useSWR<ApiResponse<PlansStopsItem[]>>(
		query ? [API_ROUTES.operation.PLANS_STOPS_LIST, query] : null,
		{
			fetcher: async ([url, request]: [string, PlansStopsRequest]) => await fetchApiData<PlansStopsItem[]>({ body: request, method: 'POST', url }),
			refreshInterval: 10_000,
		},
	);

	//
	// B. Transform data

	const stopsData = data?.data ?? [];

	const idsData = useMemo(() => stopsData.map(item => item.stop_id), [stopsData]);

	const optionsData = useMemo(() => stopsData.map((item): SelectDataItem => ({
		checked: false,
		disabled: false,
		label: `[${item.stop_id}] ${item.short_name || item.name}`,
		value: item.stop_id,
	})), [stopsData]);

	//
	// C. Return data

	return useMemo(() => ({
		data: stopsData,
		error: data?.error ?? (error instanceof Error ? error.message : null),
		ids: idsData,
		isLoading,
		options: optionsData,
		timestamp: data?.timestamp ?? null,
	}), [data?.error, data?.timestamp, error, idsData, isLoading, isValidating, optionsData, stopsData]);
}
