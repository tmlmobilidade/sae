/* * */

import { FiltersBar } from '@tmlmobilidade/ui';

import { ExtractionsListFilterProcessingStatus } from '../ExtractionsListFilterProcessingStatus';
import { ExtractionsListFilterScope } from '../ExtractionsListFilterScope';

/* * */

export function ExtractionsListFilterBar() {
	return (
		<FiltersBar>
			<ExtractionsListFilterProcessingStatus />
			<ExtractionsListFilterScope />
		</FiltersBar>
	);
}
