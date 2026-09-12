/* * */

import { SearchField } from '@tmlmobilidade/ui';

import { useExtractionsListFilterSearch } from './use-extractions-list-filter-search';

/* * */

export function ExtractionsListFilterSearch() {
	//

	//
	// A. Setup variables

	const filterSearch = useExtractionsListFilterSearch();

	//
	// B. Render components

	return (
		<SearchField
			onChange={filterSearch.set}
			value={filterSearch.value}
		/>
	);
}
