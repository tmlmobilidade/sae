'use client';

import { useFilterStateList, type UseFilterStateListReturnType } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook to manage the organization IDs filter for the users list filter bar.
 * @returns The filter state management object.
 */
export function useExtractionsListFilterScope(): UseFilterStateListReturnType {
	//

	const { t } = useTranslation();

	const selectOptions = useMemo(() =>
		[].map(item => ({
			label: t(`reference_types:${item}`),
			value: item,
		})),
	[t]);

	return useFilterStateList(
		'scope',
		[],
		selectOptions,
	);
}
