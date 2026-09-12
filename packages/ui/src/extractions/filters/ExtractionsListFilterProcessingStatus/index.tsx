/* * */

import { ListFilter } from '@tmlmobilidade/ui';
import { useTranslation } from 'react-i18next';

import { useExtractionsListFilterProcessingStatus } from './use-extractions-list-filter-processing-status';

/* * */

export function ExtractionsListFilterProcessingStatus() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const filterRole = useExtractionsListFilterProcessingStatus();

	//
	// B. Render components

	return (
		<ListFilter
			active={filterRole.isActive}
			label={t('shared:extractions.ExtractionsListFilterProcessingStatus.label')}
			onChange={filterRole.set}
			options={filterRole.options}
			isMultiple
			withToggleAll
		/>
	);
}
