'use client';

import { ProcessingStatusValues } from '@tmlmobilidade/go-types-shared';
import { useFilterStateList, type UseFilterStateListReturnType } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook to manage the processing status IDs filter for the extractions list filter bar.
 * @returns The filter state management object.
 */
export function useExtractionsListFilterProcessingStatus(): UseFilterStateListReturnType {
	//

	const { t } = useTranslation();

	const selectOptions = useMemo(() =>
		ProcessingStatusValues.map(item => ({
			label: t(`shared:status.processing_status:${item}`),
			value: item,
		})),
	[t]);

	return useFilterStateList(
		'processing_status',
		[...ProcessingStatusValues],
		selectOptions,
	);
}
