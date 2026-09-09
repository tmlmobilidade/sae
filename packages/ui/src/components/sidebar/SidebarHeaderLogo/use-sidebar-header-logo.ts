'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type SidebarLogoPlatformResponse } from '@tmlmobilidade/go-types-core';
import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { useMemo } from 'react';
import useSWR from 'swr';

import { fetchApiData } from '../../../fetch';
import { useCurrentThemeMode } from '../../../layout';

/* * */

interface UseSidebarHeaderLogoReturnType {
	data: null | SidebarLogoPlatformResponse
	error: null | string
	isLoading: boolean
	isValidating: boolean
	timestamp: null | UnixMilliseconds
}

/* * */

export function useSidebarHeaderLogo(): UseSidebarHeaderLogoReturnType {
	//

	//
	// A. Setup variables

	const currentThemeMode = useCurrentThemeMode();

	//
	// B. Fetch data

	const { data, error, isLoading, isValidating, mutate } = useSWR([API_ROUTES.core.PLATFORM_SIDEBAR_LOGO, currentThemeMode], {
		fetcher: async ([url, themeMode]) => await fetchApiData<SidebarLogoPlatformResponse>({ body: { theme_mode: themeMode }, method: 'POST', url }),
		refreshInterval: 600_000, // 10 minutes
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
