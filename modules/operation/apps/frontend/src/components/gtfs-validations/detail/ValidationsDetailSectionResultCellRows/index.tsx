/* * */

import { TagGroup, type TagProps } from '@tmlmobilidade/ui';

/* * */

interface ValidationsDetailSectionResultCellRowsProps {
	rows: number[]
}

/* * */

export function ValidationsDetailSectionResultCellRows({ rows }: ValidationsDetailSectionResultCellRowsProps) {
	//

	//
	// A. Setup variables

	const MAX_ROWS = 10;

	//
	// B. Transform data

	const preparedTags = rows
		.map((item): TagProps => ({ label: item, variant: 'muted' }))
		.filter(Boolean);

	//
	// C. Render components

	return <TagGroup limit={MAX_ROWS} tags={preparedTags} />;

	//
}
