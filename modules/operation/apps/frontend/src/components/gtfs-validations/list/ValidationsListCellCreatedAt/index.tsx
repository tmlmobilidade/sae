/* * */

import { Dates } from '@tmlmobilidade/dates';
import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { Label } from '@tmlmobilidade/ui';
import { useMemo } from 'react';

/* * */

interface ValidationsListCellDateProps {
	value: UnixMilliseconds
}

/* * */

export function ValidationsListCellDate({ value }: ValidationsListCellDateProps) {
	//

	//
	// A. Transform data

	const formattedDateString = useMemo(() => {
		// Skip if no value
		if (!value) return 'N/A';
		// Convert the Unix timestamp to a Date object.
		return Dates
			.fromUnixMilliseconds(value)
			.setZone('Europe/Lisbon', 'offset_only')
			.toLocaleString({ day: '2-digit', hour: '2-digit', minute: '2-digit', month: 'long', year: 'numeric' }, 'pt-PT');
	}, [value]);

	//
	// B. Render components

	return (
		<Label>
			{formattedDateString}
		</Label>
	);

	//
}
