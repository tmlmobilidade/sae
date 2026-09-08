'use client';

import { type PreparedTripUpdate, useEtaData } from '@/hooks/transit/use-eta-data';
import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { useMemo } from 'react';

/* * */

interface UseStopEtaDataReturnType {
	data: PreparedTripUpdate[]
	error: null | string
	isLoading: boolean
	isValidating: boolean
	mutate: () => void
	timestamp: null | UnixMilliseconds
}

/* * */

export function useStopEtaData(stopId: string): UseStopEtaDataReturnType {
	//

	//
	// A. Setup variables

	const { data: etas, error, isLoading, isValidating, mutate, timestamp } = useEtaData();

	//
	// B. Transform data

	const data = useMemo(() => etas.filter(eta => eta.stop_id === stopId), [etas, stopId]);

	//
	// C. Return data

	return useMemo(() => ({
		data,
		error,
		isLoading,
		isValidating,
		mutate,
		timestamp,
	}), [data, error, isLoading, isValidating, mutate, timestamp]);

	//
}
