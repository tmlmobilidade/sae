'use client';

/* * */

import { CardSummary } from '@/components/cards/CardSummary';
import { Columns } from '@/components/layout/Columns';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PieChart } from '@mantine/charts';
import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

export function Screen3() {
	//

	//
	// A. Setup variables

	const todayOperationalDate = getOperationalDate();

	//
	// B. Fetch data

	const { data: todaySlaData, isLoading: todaySlaLoading, isValidating: todaySlaValidating } = useSWR(`/api/sla/${todayOperationalDate}`);

	//
	// A. Render components

	const pieChartData = useMemo(() => {
		if (!todaySlaData) return [];
		const passMain = todaySlaData.data._cm_simple_three_events_pass_until_now;
		const passBilhetica = todaySlaData.data._cm_simple_three_events_or_validation_pass_until_now - todaySlaData.data._cm_simple_three_events_pass_until_now; ;
		const missed = todaySlaData.data._cm_scheduled_rides_until_now - todaySlaData.data._cm_simple_three_events_or_validation_pass_until_now;
		return [
			{ color: 'var(--palette-green)', name: 'Pass 3E', value: passMain },
			{ color: 'var(--palette-blue)', name: 'Pass 3E+B', value: passBilhetica },
			{ color: 'var(--palette-orange)', name: 'Fail', value: missed },
		];
	}, [todaySlaData]);

	const todayCmSlaParsed = useMemo(() => {
		if (!todaySlaData) return { comparison: 0, missed: 0, total: 0 };
		return {
			comparison: `${parseFloat(((todaySlaData.data._cm_simple_three_events_or_validation_pass_until_now * 100) / todaySlaData.data._cm_scheduled_rides_until_now).toFixed(2))}%`,
			missed: todaySlaData.data._cm_scheduled_rides_until_now - todaySlaData.data._cm_simple_three_events_pass_until_now,
			total: todaySlaData.data._cm_scheduled_rides_until_now,
		};
	}, [todaySlaData]);

	const today41SlaParsed = useMemo(() => {
		if (!todaySlaData) return { comparison: 0, missed: 0, total: 0 };
		return {
			comparison: `${parseFloat(((todaySlaData.data._41_simple_three_events_or_validation_pass_until_now * 100) / todaySlaData.data._41_scheduled_rides_until_now).toFixed(2))}%`,
			missed: todaySlaData.data._41_scheduled_rides_until_now - todaySlaData.data._41_simple_three_events_pass_until_now,
			total: todaySlaData.data._41_scheduled_rides_until_now,
		};
	}, [todaySlaData]);

	const today42SlaParsed = useMemo(() => {
		if (!todaySlaData) return { comparison: 0, missed: 0, total: 0 };
		return {
			comparison: `${parseFloat(((todaySlaData.data._42_simple_three_events_or_validation_pass_until_now * 100) / todaySlaData.data._42_scheduled_rides_until_now).toFixed(2))}%`,
			missed: todaySlaData.data._42_scheduled_rides_until_now - todaySlaData.data._42_simple_three_events_pass_until_now,
			total: todaySlaData.data._42_scheduled_rides_until_now,
		};
	}, [todaySlaData]);

	const today43SlaParsed = useMemo(() => {
		if (!todaySlaData) return { comparison: 0, missed: 0, total: 0 };
		return {
			comparison: `${parseFloat(((todaySlaData.data._43_simple_three_events_or_validation_pass_until_now * 100) / todaySlaData.data._43_scheduled_rides_until_now).toFixed(2))}%`,
			missed: todaySlaData.data._43_scheduled_rides_until_now - todaySlaData.data._43_simple_three_events_pass_until_now,
			total: todaySlaData.data._43_scheduled_rides_until_now,
		};
	}, [todaySlaData]);

	const today44SlaParsed = useMemo(() => {
		if (!todaySlaData) return { comparison: 0, missed: 0, total: 0 };
		return {
			comparison: `${parseFloat(((todaySlaData.data._44_simple_three_events_or_validation_pass_until_now * 100) / todaySlaData.data._44_scheduled_rides_until_now).toFixed(2))}%`,
			missed: todaySlaData.data._44_scheduled_rides_until_now - todaySlaData.data._44_simple_three_events_pass_until_now,
			total: todaySlaData.data._44_scheduled_rides_until_now,
		};
	}, [todaySlaData]);

	//
	// A. Render components

	return (
		<ScreenWrapper>
			<Columns cols={1}>
				<PieChart data={pieChartData} endAngle={450} size={500} startAngle={90} />
			</Columns>
			<Columns cols={1}>
				<CardSummary
					bigNumber={todayCmSlaParsed.missed}
					comparison={todayCmSlaParsed.comparison}
					isLoading={todaySlaLoading}
					isValidating={todaySlaValidating}
					level={1}
					timestamp={todaySlaData?.timestamp}
					title="CM / Viagens não executadas hoje até agora"
				/>
			</Columns>
			<Columns cols={2}>
				<CardSummary
					bigNumber={today41SlaParsed.missed}
					comparison={today41SlaParsed.comparison}
					isLoading={todaySlaLoading}
					isValidating={todaySlaValidating}
					level={2}
					timestamp={todaySlaData?.timestamp}
					title="41 / Viagens não executadas hoje até agora"
				/>
				<CardSummary
					bigNumber={today42SlaParsed.missed}
					comparison={today42SlaParsed.comparison}
					isLoading={todaySlaLoading}
					isValidating={todaySlaValidating}
					level={2}
					timestamp={todaySlaData?.timestamp}
					title="42 / Viagens não executadas hoje até agora"
				/>
				<CardSummary
					bigNumber={today43SlaParsed.missed}
					comparison={today43SlaParsed.comparison}
					isLoading={todaySlaLoading}
					isValidating={todaySlaValidating}
					level={2}
					timestamp={todaySlaData?.timestamp}
					title="43 / Viagens não executadas hoje até agora"
				/>
				<CardSummary
					bigNumber={today44SlaParsed.missed}
					comparison={today44SlaParsed.comparison}
					isLoading={todaySlaLoading}
					isValidating={todaySlaValidating}
					level={2}
					timestamp={todaySlaData?.timestamp}
					title="44 / Viagens não executadas hoje até agora"
				/>
			</Columns>
		</ScreenWrapper>
	);

	//
}
