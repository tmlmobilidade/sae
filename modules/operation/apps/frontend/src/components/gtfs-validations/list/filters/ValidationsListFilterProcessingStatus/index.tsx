/* * */

import { ListFilter } from '@tmlmobilidade/ui';

import { useValidationsListFilterProcessingStatus } from './use-validations-list-filter-processing-status';

/* * */

export function ValidationsListFilterProcessingStatus() {
	//

	//
	// A. Setup variables

	const filterProcessingStatus = useValidationsListFilterProcessingStatus();

	//
	// B. Render components

	return (
		<ListFilter
			active={filterProcessingStatus.isActive}
			label="Estado"
			onChange={filterProcessingStatus.set}
			options={filterProcessingStatus.options}
			isMultiple
			withToggleAll
		/>
	);

	//
}
