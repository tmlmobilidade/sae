/* * */

import { ListFilter } from '@tmlmobilidade/ui';

import { useValidationsListFilterAgency } from './use-validations-list-filter-agency';

/* * */

export function ValidationsListFilterAgency() {
	//

	//
	// A. Setup variables

	const filterAgency = useValidationsListFilterAgency();

	//
	// B. Render components

	return (
		<ListFilter
			active={filterAgency.isActive}
			label="Operador"
			onChange={filterAgency.set}
			options={filterAgency.options}
			isMultiple
			withToggleAll
		/>
	);

	//
}
