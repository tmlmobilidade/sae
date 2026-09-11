/* * */

import { TagGroup, type TagProps } from '@tmlmobilidade/ui';

/* * */

interface VehiclesListCellAgenciesProps {
	agencyIds: string[]
}

/* * */

export function VehiclesListCellAgencies({ agencyIds }: VehiclesListCellAgenciesProps) {
	//

	//
	// A. Transform data

	const preparedTags = agencyIds.map((item): TagProps => ({ label: item, variant: 'muted' }));

	//
	// B. Render components

	return <TagGroup limit={4} tags={preparedTags} />;

	//
}
