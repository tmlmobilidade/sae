'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type PlanListFilters, type PlanListItem } from '@tmlmobilidade/go-plans-pckg-types';
import { type ApiResponse, type UnixTimestamp } from '@tmlmobilidade/go-types-shared';
import { fetchApiData } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

interface UsePlansExportListDataReturnType {
	data: PlanListItem[]
	error: null | string
	isLoading: boolean
	isValidating: boolean
	timestamp: null | UnixTimestamp
}

/**
 * Fetch plans available to an export flow for the selected agency.
 */
export function usePlansExportListData(agencyId: null | string): UsePlansExportListDataReturnType {
	//

	//
	// A. Setup query

	const query = useMemo<null | PlanListFilters>(() => agencyId ? ({
		agency_ids: [agencyId],
		validity_statuses: [],
	}) : null, [agencyId]);

	//
	// B. Fetch data

	const { data, error, isLoading, isValidating } = useSWR<ApiResponse<PlanListItem[]>>(
		query ? [API_ROUTES.plans.PLANS_LIST, query] : null,
		{
			fetcher: async ([url, request]: [string, PlanListFilters]) => await fetchApiData<PlanListItem[]>({ body: request, method: 'POST', url }),
			refreshInterval: 10_000,
		},
	);

	//
	// C. Return data

	return useMemo(() => ({
		data: data?.data ?? [],
		error: data?.error ?? (error instanceof Error ? error.message : null),
		isLoading,
		isValidating,
		timestamp: data?.timestamp ?? null,
	}), [data, error, isLoading, isValidating]);
}
