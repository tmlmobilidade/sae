'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type ApiResponse, type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { fetchApiData } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

export interface PreparedTripUpdate {
	eta_at: number
	eta_seconds: number
	stop_id: string
	stop_name: string
	stop_sequence: number
	trip_id: string
	vehicle_id: string
}

interface UseEtaDataReturnType {
	data: PreparedTripUpdate[]
	error: null | string
	isLoading: boolean
	isValidating: boolean
	mutate: () => void
	timestamp: null | UnixMilliseconds
}

/* * */

export function useEtaData(): UseEtaDataReturnType {
	//

	//
	// A. Fetch data

	const { data, error, isLoading, isValidating, mutate } = useSWR<ApiResponse<PreparedTripUpdate[]>>(API_ROUTES.hub.REALTIME_ETA, {
		fetcher: async url => await fetchApiData<PreparedTripUpdate[]>({ options: { credentials: 'omit' }, url }),
		refreshInterval: 5_000,
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
