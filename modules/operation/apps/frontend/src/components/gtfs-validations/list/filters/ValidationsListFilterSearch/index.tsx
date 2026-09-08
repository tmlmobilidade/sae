/* * */

import { SearchField } from '@tmlmobilidade/ui';

import { useValidationsListFilterSearch } from './use-validations-list-filter-search';

/* * */

export function ValidationsListFilterSearch() {
	//

	//
	// A. Setup variables

	const filterSearch = useValidationsListFilterSearch();

	//
	// B. Render components

	return (
		<SearchField
			onChange={filterSearch.set}
			value={filterSearch.value}
		/>
	);

	//
}
