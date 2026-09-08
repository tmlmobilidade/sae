/* * */

import { ListFilter } from '@tmlmobilidade/ui';

import { useValidationsListFilterValidityStatus } from './use-validations-list-filter-validity-status';

/* * */

export function ValidationsListFilterValidityStatus() {
	//

	//
	// A. Setup variables

	const filterValidityStatus = useValidationsListFilterValidityStatus();

	//
	// B. Render components

	return (
		<ListFilter
			active={filterValidityStatus.isActive}
			label="Resultado"
			onChange={filterValidityStatus.set}
			options={filterValidityStatus.options}
			isMultiple
			withToggleAll
		/>
	);

	//
}
