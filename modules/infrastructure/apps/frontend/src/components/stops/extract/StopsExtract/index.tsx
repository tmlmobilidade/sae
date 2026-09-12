'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type Extraction, type InfrastructureStopsV1ExtractionCreate } from '@tmlmobilidade/go-types-extractions';
import { Button, fetchApiData, Pane, Section, useExtractionsListData, useHandleAction } from '@tmlmobilidade/ui';

import { StopsExtractHeader } from '../StopsExtractHeader';

/* * */

export function StopsExtract() {
	//

	//
	// A. Setup variables

	const { mutate } = useExtractionsListData();

	const { action: handleExtract } = useHandleAction({
		fetchFn: async () => await fetchApiData<Extraction[], InfrastructureStopsV1ExtractionCreate>({
			body: {
				properties: {
					municipality_ids: [],
				},
				send_email_notification: false,
				version: 'infrastructure-stops-v1',
			},
			method: 'POST',
			url: API_ROUTES.core.PLATFORM_EXTRACTIONS_CREATE,
		}),
		onSuccess: (response) => {
			mutate(response);
		},
	});

	//
	// B. Render components

	return (
		<Pane header={[<StopsExtractHeader key="header" />]}>
			<Section>
				<Button label="Extract" onClick={handleExtract} />
			</Section>
		</Pane>
	);
}
