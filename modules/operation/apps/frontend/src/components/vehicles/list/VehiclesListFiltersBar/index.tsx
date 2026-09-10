/* * */

import { VehiclesListFilterAgencies } from '@/components/vehicles2/list/VehicleListFilterAgencies';
import { FiltersBar } from '@tmlmobilidade/ui';

/* * */

export function VehiclesListFiltersBar() {
	return (
		<FiltersBar>
			<VehiclesListFilterAgencies />
		</FiltersBar>
	);
}
