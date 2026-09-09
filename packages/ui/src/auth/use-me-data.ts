'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type User } from '@tmlmobilidade/go-types-core';
import { type ApiResponse, type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { fetchApiData } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

interface UseMeDataReturnType {
	data: User
	error: null | string
	isLoading: boolean
	isValidating: boolean
	mutate: (data?: ApiResponse<User>) => void
	timestamp: null | UnixMilliseconds
}

/* * */

export function useMeData(): UseMeDataReturnType {
	//

	//
	// A. Fetch data

	const { data, error, isLoading, isValidating, mutate } = useSWR<ApiResponse<User>>(API_ROUTES.core.PLATFORM_ME, {
		fetcher: async (url: string) => await fetchApiData<User>({ url }),
		refreshInterval: 60_000, // 1 minute
	});

	//
	// B. Return data

	return useMemo(() => ({
		data: data?.data,
		error: error?.error,
		isLoading,
		isValidating,
		mutate,
		timestamp: data?.timestamp,
	}), [data, error, isLoading, isValidating, mutate]);
};
