'use client';

import { Pane } from '@tmlmobilidade/ui';

import { ExtractionsListHeader } from '../ExtractionsListHeader';

/* * */

export function ExtractionsList() {
	return (
		<Pane header={[<ExtractionsListHeader key="header" />]}>
			{/* <ExtractionsListBasicInfo /> */}
		</Pane>
	);
}
