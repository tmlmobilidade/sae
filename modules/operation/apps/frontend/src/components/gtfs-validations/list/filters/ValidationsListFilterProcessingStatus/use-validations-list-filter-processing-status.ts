'use client';

import { ProcessingStatusValues } from '@tmlmobilidade/go-types-shared';
import { useFilterStateList, type UseFilterStateListReturnType } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Manage the processing-status filter for the validations list.
 */
export function useValidationsListFilterProcessingStatus(): UseFilterStateListReturnType {
	//

	const { t } = useTranslation();

	const selectOptions = useMemo(() =>
		ProcessingStatusValues.map(item => ({ label: t(`shared:status.processing_status.${item}`), value: item })),
	[t],
	);

	return useFilterStateList(
		'processing_status',
		[...ProcessingStatusValues],
		selectOptions,
	);
}
