'use client';

import { useFilterStateText, type UseFilterStateTextReturnType } from '@tmlmobilidade/ui';

/**
 * Manage the search filter for the validations list.
 */
export function useValidationsListFilterSearch(): UseFilterStateTextReturnType {
	return useFilterStateText('search');
}
