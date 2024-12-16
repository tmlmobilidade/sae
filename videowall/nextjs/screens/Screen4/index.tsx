'use client';

/* * */

import { CardDefault } from '@/components/CardDefault';
import { Grid } from '@/components/Grid';
import { IconCircleCheckFilled } from '@tabler/icons-react';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

export function Screen4() {
	//

	//
	// A. Fetch data

	const { data: emptyRidesData, isLoading: emptyRidesLoading, isValidating: emptyRidesValidating } = useSWR('https://api.cmet.pt/metrics/videowall/empty-rides');

	//
	// B. Transform data

	const emptyRidesCmParsed = useMemo(() => {
		if (!emptyRidesData) return { primary_value: 0, secondary_value: 0, secondary_value_string: '?%' };
		return {
			primary_value: emptyRidesData.data._cm_empty_rides_count,
			primary_value_string: Intl.NumberFormat('pt-PT').format(emptyRidesData.data._cm_empty_rides_count),
			secondary_value: emptyRidesData.data._cm_empty_rides_vkm,
			secondary_value_string: `${Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(emptyRidesData.data._cm_empty_rides_vkm / 1000)} vkm`,
		};
	}, [emptyRidesData]);

	//
	// C. Render components

	return (
		<Grid
			layout="twoDetailsWithPrimary"
			cells={[
				<CardDefault
					icon={<IconCircleCheckFilled />}
					isLoading={emptyRidesLoading}
					isValidating={emptyRidesValidating}
					sentiment="normal"
					timestamp={emptyRidesData?.timestamp_resource}
					title="CM / Viagens sem passageiros até agora"
					valuePrimary={emptyRidesCmParsed.primary_value_string}
					valueSecondary={emptyRidesCmParsed.secondary_value_string}
				/>,
			]}
		/>
	);

	//
}
