'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type HubRoute } from '@tmlmobilidade/go-types-hub';
import { type ApiResponse, type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { fetchApiData } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

interface UseRoutesDataReturnType {
	data: HubRoute[]
	error: null | string
	isLoading: boolean
	isValidating: boolean
	mutate: () => void
	timestamp: null | UnixMilliseconds
}

/* * */

export function useRoutesData(): UseRoutesDataReturnType {
	//

	//
	// A. Fetch data

	const { data, error, isLoading, isValidating, mutate } = useSWR<ApiResponse<HubRoute[]>>(API_ROUTES.hub.NETWORK_ROUTES, {
		fetcher: async url => await fetchApiData<HubRoute[]>({ options: { credentials: 'omit' }, url }),
	});

	//
	// B. Return data

	return useMemo(() => ({
		data: data?.data ?? [],
		error: error?.error ?? null,
		isLoading,
		isValidating,
		mutate,
		timestamp: data?.timestamp ?? null,
	}), [data?.data, data?.timestamp, error?.error, isLoading, isValidating, mutate]);

	//
}
