/* * */

import { ValidationsListFilterAgency } from '@/components/gtfs-validations/list/filters/ValidationsListFilterAgency';
import { ValidationsListFilterProcessingStatus } from '@/components/gtfs-validations/list/filters/ValidationsListFilterProcessingStatus';
import { ValidationsListFilterValidityStatus } from '@/components/gtfs-validations/list/filters/ValidationsListFilterValidityStatus';
import { FiltersBar } from '@tmlmobilidade/ui';

/* * */

export function ValidationsListFiltersBar() {
	return (
		<FiltersBar>
			<ValidationsListFilterAgency />
			<ValidationsListFilterProcessingStatus />
			<ValidationsListFilterValidityStatus />
		</FiltersBar>
	);
}
