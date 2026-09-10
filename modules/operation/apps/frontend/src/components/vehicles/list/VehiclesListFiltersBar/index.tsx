/* * */

import { VehiclesListFilterAgencies } from '@/components/vehicles/list/VehicleListFilterAgencies';
import { FiltersBar } from '@tmlmobilidade/ui';

/* * */

export function VehiclesListFiltersBar() {
	return (
		<FiltersBar>
			<VehiclesListFilterAgencies />
		</FiltersBar>
	);
}
