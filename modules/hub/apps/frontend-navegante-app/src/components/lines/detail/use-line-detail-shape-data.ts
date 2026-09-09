'use client';

import { API_ROUTES } from '@tmlmobilidade/consts';
import { type HubPattern, type HubShape } from '@tmlmobilidade/go-types-hub';
import { fetchApiData } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

export function useLineDetailShapeData(activePattern: HubPattern | null): HubShape | null {
	//

	// A. Fetch data

	const { data } = useSWR(activePattern?.shape_id ? API_ROUTES.hub.NETWORK_SHAPES(activePattern.shape_id) : null, async url => await fetchApiData<HubShape>({ options: { credentials: 'omit' }, url }));

	//
	// B. Transform data

	return useMemo(() => {
		const shape = data?.data;
		if (!shape || !activePattern) return null;

		return {
			...shape,
			geojson: {
				...shape.geojson,
				properties: {
					color: activePattern.color,
					text_color: activePattern.text_color,
				},
			},
		};
	}, [activePattern, data?.data]);

	//
}
