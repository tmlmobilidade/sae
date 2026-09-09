'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { AlertsComposeRequest, AlertsComposeResponse } from '@tmlmobilidade/go-operation-pckg-types';
import { type ApiResponse, type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { fetchApiData } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

interface UseAlertsComposeDataReturnType {
	data: AlertsComposeResponse
	error: null | string
	isLoading: boolean
	isValidating: boolean
	timestamp: null | UnixMilliseconds
}

/* * */

export function useAlertsComposeData(requestBody: AlertsComposeRequest, enabled = true): UseAlertsComposeDataReturnType {
	//

	//
	// A. Fetch data

	const { data, error, isLoading, isValidating } = useSWR<ApiResponse<AlertsComposeResponse>>([enabled && API_ROUTES.operation.ALERTS_COMPOSE, requestBody], {
		fetcher: async ([url, requestBody]) => await fetchApiData<AlertsComposeResponse>({ body: requestBody, method: 'POST', url }),
		refreshInterval: 0, // Disabled
		revalidateIfStale: false,
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
	});

	//
	// B. Return data

	return useMemo(() => ({
		data: data?.data,
		error: error?.error,
		isLoading,
		isValidating,
		timestamp: data?.timestamp,
	}), [data, error, isLoading, isValidating]);
};
