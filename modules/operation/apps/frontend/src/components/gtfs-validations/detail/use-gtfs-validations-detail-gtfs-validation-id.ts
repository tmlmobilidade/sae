'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';

/* * */

interface UseGtfsValidationsDetailGtfsValidationIdReturnType {
	gtfsValidationId: string
}

/* * */

export function useGtfsValidationsDetailGtfsValidationId(): UseGtfsValidationsDetailGtfsValidationIdReturnType {
	//

	//
	// A. Setup variables

	const params = useParams<{ gtfsValidationId: string }>();

	const gtfsValidationId = decodeURIComponent(params.gtfsValidationId);

	//
	// B. Return data

	return useMemo(() => ({
		gtfsValidationId,
	}), [gtfsValidationId]);
}
