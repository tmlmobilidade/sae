'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type GtfsValidation } from '@tmlmobilidade/go-types-operation';
import { type ApiResponse, type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { fetchApiData } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

import { useValidationsDetailValidationId } from './use-validations-detail-validation-id';

/* * */

interface UseGtfsValidationsDetailDataReturnType {
	data: GtfsValidation | null
	error: null | string
	isLoading: boolean
	isValidating: boolean
	mutate: () => void
	timestamp: null | UnixMilliseconds
}

/* * */

export function useGtfsValidationsDetailData(): UseGtfsValidationsDetailDataReturnType {
	//

	//
	// A. Setup variables

	const { validationId } = useValidationsDetailValidationId();

	//
	// B. Fetch data

	const { data, error, isLoading, isValidating, mutate } = useSWR<ApiResponse<GtfsValidation>>(API_ROUTES.operation.GTFS_VALIDATIONS_DETAIL(validationId), {
		fetcher: async (url: string) => await fetchApiData<GtfsValidation>({ url }),
		refreshInterval: 3_000,
	});

	//
	// C. Return data

	return useMemo(() => ({
		data: data?.data ?? null,
		error: data?.error ?? (error instanceof Error ? error.message : null),
		isLoading,
		isValidating,
		mutate,
		timestamp: data?.timestamp ?? null,
	}), [data, error, isLoading, isValidating, mutate]);
}
