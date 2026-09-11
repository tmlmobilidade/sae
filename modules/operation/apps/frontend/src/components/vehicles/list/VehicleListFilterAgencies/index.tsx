/* * */

import { useVehiclesListContext } from '@/contexts/VehiclesList.context';
import { ListFilter, useAgenciesContext } from '@tmlmobilidade/ui';
import { useMemo } from 'react';

/* * */

export function VehiclesListFilterAgencies() {
	//

	//
	// A. Setup variables

	const agenciesContext = useAgenciesContext();
	const vehiclesListContext = useVehiclesListContext();

	//
	// B. Transform data

	const isActive = useMemo(() => {
		// The default for this filter is to show all agencies
		const defaultValues = agenciesContext.data.raw.map(item => item._id);
		const enabledValues = vehiclesListContext.filters.agency;
		// Check if the arrays are equal by quickly comparing their lengths
		if (defaultValues.length !== enabledValues.value.length) return true;
		// If the length is the same ensure they're equal by also
		// checking if every item in one array is included in the other.
		return !defaultValues.every(item => enabledValues.value.includes(item));
	}, [vehiclesListContext.filters.agency, agenciesContext.data.raw]);

	const parsedOptions = useMemo(() => {
		// Skip if options are not provided or are empty.
		if (!agenciesContext.data.raw?.length) return [];
		// Parse options to the expected format.
		return agenciesContext.data.raw.map(item => ({
			checked: vehiclesListContext.filters.agency.value.includes(item._id),
			label: item.name,
			value: item._id,
		}));
	}, [vehiclesListContext.filters.agency, agenciesContext.data.raw]);

	//
	// C. Render components

	return (
		<ListFilter
			active={isActive}
			label="Operadores"
			onChange={vehiclesListContext.filters.agency.set}
			options={parsedOptions}
			withToggleAll
		/>
	);

	//
}
