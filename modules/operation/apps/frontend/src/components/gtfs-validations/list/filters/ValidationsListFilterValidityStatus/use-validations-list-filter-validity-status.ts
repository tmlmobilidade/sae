'use client';

import { ValidityStatusValues } from '@tmlmobilidade/go-types-shared';
import { useFilterStateList, type UseFilterStateListReturnType } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Manage the validity-status filter for the validations list.
 * @returns The filter state management object.
 */
export function useValidationsListFilterValidityStatus(): UseFilterStateListReturnType {
	//

	const { t } = useTranslation();

	const selectOptions = useMemo(() =>
		ValidityStatusValues.map(item => ({
			label: t(`shared:status.validity_status.${item}`),
			value: item,
		})),
	[t],
	);

	return useFilterStateList(
		'validity_status',
		[...ValidityStatusValues],
		selectOptions,
	);
}
