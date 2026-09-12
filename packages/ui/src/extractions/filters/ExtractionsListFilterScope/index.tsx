/* * */

import { ListFilter } from '@tmlmobilidade/ui';
import { useTranslation } from 'react-i18next';

import { useExtractionsListFilterScope } from './use-extractions-list-filter-scope';

/* * */

export function ExtractionsListFilterScope() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const filterScope = useExtractionsListFilterScope();

	//
	// B. Render components

	return (
		<ListFilter
			active={filterScope.isActive}
			label={t('shared:extractions.ExtractionsListFilterScope.label')}
			onChange={filterScope.set}
			options={filterScope.options}
			isMultiple
			withToggleAll
		/>
	);
}
