'use client';

import { useFilterStateText, type UseFilterStateTextReturnType } from '@tmlmobilidade/ui';

/**
 * Hook to manage the search filter for the extractions list filter bar.
 * @returns The filter state management object.
 */
export function useExtractionsListFilterSearch(): UseFilterStateTextReturnType {
	return useFilterStateText('extractions-search');
}
