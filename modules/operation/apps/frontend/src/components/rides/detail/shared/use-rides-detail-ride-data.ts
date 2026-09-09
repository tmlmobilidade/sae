'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type ControllerRidesDetailRideItem } from '@tmlmobilidade/go-operation-pckg-types';
import { type ApiResponse, type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { fetchApiData } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

import { useRidesDetailRideId } from './use-rides-detail-ride-id';

/* * */

interface UseRidesDetailRideDataReturnType {
	data: ControllerRidesDetailRideItem
	error: null | string
	isLoading: boolean
	isValidating: boolean
	mutate: () => void
	timestamp: null | UnixMilliseconds
}

/* * */

export function useRidesDetailRideData(): UseRidesDetailRideDataReturnType {
	//

	//
	// A. Setup variables

	const { rideId } = useRidesDetailRideId();

	//
	// B. Fetch data

	const { data, error, isLoading, isValidating, mutate } = useSWR<ApiResponse<ControllerRidesDetailRideItem>>(rideId && API_ROUTES.operation.RIDES_DETAIL_RIDE(rideId), {
		fetcher: async (url: string) => await fetchApiData<ControllerRidesDetailRideItem>({ url }),
		refreshInterval: 10_000, // 10 seconds
	});

	//
	// C. Return data

	return useMemo(() => ({
		data: data?.data,
		error: error?.error,
		isLoading,
		isValidating,
		mutate,
		timestamp: data?.timestamp,
	}), [data, error, isLoading, isValidating, mutate]);
};
