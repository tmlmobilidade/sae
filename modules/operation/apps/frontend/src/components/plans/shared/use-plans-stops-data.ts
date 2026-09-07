'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type PlanStopItem, type PlanStopRequest } from '@tmlmobilidade/go-plans-pckg-types';
import { type ApiResponse, type UnixTimestamp } from '@tmlmobilidade/go-types-shared';
import { fetchApiData, type SelectDataItem } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

interface UsePlansStopsReturnType {
	data: PlanStopItem[]
	error: null | string
	ids: string[]
	isLoading: boolean
	options: SelectDataItem[]
	timestamp: null | UnixTimestamp
}

/**
 * Fetch stops available to Plans poster exports for the selected agency.
 */
export function usePlansStops(query: null | PlanStopRequest): UsePlansStopsReturnType {
	//

	//
	// A. Fetch data

	const { data, error, isLoading, isValidating } = useSWR<ApiResponse<PlanStopItem[]>>(
		query ? [API_ROUTES.plans.PLANS_POSTER_STOPS, query] : null,
		{
			fetcher: async ([url, request]: [string, PlanStopRequest]) => await fetchApiData<PlanStopItem[]>({ body: request, method: 'POST', url }),
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
