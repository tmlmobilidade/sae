'use client';

/* * */

import { CardDefault } from '@/components/CardDefault';
import { Grid } from '@/components/Grid';
import { IconCircleCheckFilled } from '@tabler/icons-react';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

export function Screen2() {
	//

	//
	// A. Fetch data

	const { data: slaData, isLoading: slaLoading, isValidating: slaValidating } = useSWR('https://api.cmet.pt/metrics/videowall/sla');

	//
	// B. Transform data

	const slaCmParsed = useMemo(() => {
		if (!slaData) return { primary_value: 0, secondary_value: 0, secondary_value_string: '?%' };
		return {
			primary_value: slaData.data._cm_simple_three_events_fail_until_now,
			primary_value_string: Intl.NumberFormat('pt-PT').format(slaData.data._cm_simple_three_events_fail_until_now),
			secondary_value: slaData.data._cm_simple_three_events_fail_until_now / slaData.data._cm_scheduled_rides_until_now,
			secondary_value_string: `${parseFloat(((slaData.data._cm_simple_three_events_fail_until_now * 100) / slaData.data._cm_scheduled_rides_until_now).toFixed(2))}%`,
		};
	}, [slaData]);

	const sla41Parsed = useMemo(() => {
		if (!slaData) return { primary_value: 0, secondary_value: 0, secondary_value_string: '?%' };
		return {
			primary_value: slaData.data._41_simple_three_events_fail_until_now,
			primary_value_string: Intl.NumberFormat('pt-PT').format(slaData.data._41_simple_three_events_fail_until_now),
			secondary_value: slaData.data._41_simple_three_events_fail_until_now / slaData.data._41_scheduled_rides_until_now,
			secondary_value_string: `${parseFloat(((slaData.data._41_simple_three_events_fail_until_now * 100) / slaData.data._41_scheduled_rides_until_now).toFixed(2))}%`,
		};
	}, [slaData]);

	const sla42Parsed = useMemo(() => {
		if (!slaData) return { primary_value: 0, secondary_value: 0, secondary_value_string: '?%' };
		return {
			primary_value: slaData.data._42_simple_three_events_fail_until_now,
			primary_value_string: Intl.NumberFormat('pt-PT').format(slaData.data._42_simple_three_events_fail_until_now),
			secondary_value: slaData.data._42_simple_three_events_fail_until_now / slaData.data._42_scheduled_rides_until_now,
			secondary_value_string: `${parseFloat(((slaData.data._42_simple_three_events_fail_until_now * 100) / slaData.data._42_scheduled_rides_until_now).toFixed(2))}%`,
		};
	}, [slaData]);

	const sla43Parsed = useMemo(() => {
		if (!slaData) return { primary_value: 0, secondary_value: 0, secondary_value_string: '?%' };
		return {
			primary_value: slaData.data._43_simple_three_events_fail_until_now,
			primary_value_string: Intl.NumberFormat('pt-PT').format(slaData.data._43_simple_three_events_fail_until_now),
			secondary_value: slaData.data._43_simple_three_events_fail_until_now / slaData.data._43_scheduled_rides_until_now,
			secondary_value_string: `${parseFloat(((slaData.data._43_simple_three_events_fail_until_now * 100) / slaData.data._43_scheduled_rides_until_now).toFixed(2))}%`,
		};
	}, [slaData]);

	const sla44Parsed = useMemo(() => {
		if (!slaData) return { primary_value: 0, secondary_value: 0, secondary_value_string: '?%' };
		return {
			primary_value: slaData.data._44_simple_three_events_fail_until_now,
			primary_value_string: Intl.NumberFormat('pt-PT').format(slaData.data._44_simple_three_events_fail_until_now),
			secondary_value: slaData.data._44_simple_three_events_fail_until_now / slaData.data._44_scheduled_rides_until_now,
			secondary_value_string: `${parseFloat(((slaData.data._44_simple_three_events_fail_until_now * 100) / slaData.data._44_scheduled_rides_until_now).toFixed(2))}%`,
		};
	}, [slaData]);

	//
	// C. Render components

	return (
		<Grid
			layout="primaryWithFourDetails"
			cells={[
				<CardDefault
					icon={<IconCircleCheckFilled />}
					isLoading={slaLoading}
					isValidating={slaValidating}
					sentiment={slaCmParsed.secondary_value > 0.05 ? 'bad' : 'good'}
					timestamp={slaData?.timestamp_resource}
					title="CM / Viagens não executadas hoje, até agora"
					valuePrimary={slaCmParsed.primary_value_string}
					valueSecondary={slaCmParsed.secondary_value_string}
				/>,
				<CardDefault
					icon={<IconCircleCheckFilled />}
					isLoading={slaLoading}
					isValidating={slaValidating}
					sentiment={sla41Parsed.secondary_value > 0.05 ? 'bad' : 'good'}
					timestamp={slaData?.timestamp_resource}
					title="41 / Viagens não executadas hoje, até agora"
					valuePrimary={sla41Parsed.primary_value_string}
					valueSecondary={sla41Parsed.secondary_value_string}
				/>,
				<CardDefault
					icon={<IconCircleCheckFilled />}
					isLoading={slaLoading}
					isValidating={slaValidating}
					sentiment={sla42Parsed.secondary_value > 0.05 ? 'bad' : 'good'}
					timestamp={slaData?.timestamp_resource}
					title="42 / Viagens não executadas hoje, até agora"
					valuePrimary={sla42Parsed.primary_value_string}
					valueSecondary={sla42Parsed.secondary_value_string}
				/>,
				<CardDefault
					icon={<IconCircleCheckFilled />}
					isLoading={slaLoading}
					isValidating={slaValidating}
					sentiment={sla43Parsed.secondary_value > 0.05 ? 'bad' : 'good'}
					timestamp={slaData?.timestamp_resource}
					title="43 / Viagens não executadas hoje, até agora"
					valuePrimary={sla43Parsed.primary_value_string}
					valueSecondary={sla43Parsed.secondary_value_string}
				/>,
				<CardDefault
					icon={<IconCircleCheckFilled />}
					isLoading={slaLoading}
					isValidating={slaValidating}
					sentiment={sla44Parsed.secondary_value > 0.05 ? 'bad' : 'good'}
					timestamp={slaData?.timestamp_resource}
					title="44 / Viagens não executadas hoje, até agora"
					valuePrimary={sla44Parsed.primary_value_string}
					valueSecondary={sla44Parsed.secondary_value_string}
				/>,
			]}
		/>
	);

	//
}
