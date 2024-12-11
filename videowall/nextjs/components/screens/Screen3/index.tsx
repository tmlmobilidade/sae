'use client';

/* * */

import { DefaultCard } from '@/components/cards/DefaultCard';
import { Columns } from '@/components/layout/Columns';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { IconCheckbox, IconCircleCheckFilled } from '@tabler/icons-react';
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
	// C. Transform data

	const todayCmSlaParsed = useMemo(() => {
		if (!todaySlaData) return { comparison: 0, missed: 0, total: 0 };
		return {
			comparison: `${parseFloat(((todaySlaData.data._cm_simple_three_events_or_validation_pass_until_now * 100) / todaySlaData.data._cm_scheduled_rides_until_now).toFixed(2))}%`,
			missed: todaySlaData.data._cm_scheduled_rides_until_now - todaySlaData.data._cm_simple_three_events_pass_until_now,
			total: todaySlaData.data._cm_scheduled_rides_until_now,
		};
	}, [todaySlaData]);

	// const today41SlaParsed = useMemo(() => {
	// 	if (!todaySlaData) return { comparison: 0, missed: 0, total: 0 };
	// 	return {
	// 		comparison: `${parseFloat(((todaySlaData.data._41_simple_three_events_or_validation_pass_until_now * 100) / todaySlaData.data._41_scheduled_rides_until_now).toFixed(2))}%`,
	// 		missed: todaySlaData.data._41_scheduled_rides_until_now - todaySlaData.data._41_simple_three_events_pass_until_now,
	// 		total: todaySlaData.data._41_scheduled_rides_until_now,
	// 	};
	// }, [todaySlaData]);

	// const today42SlaParsed = useMemo(() => {
	// 	if (!todaySlaData) return { comparison: 0, missed: 0, total: 0 };
	// 	return {
	// 		comparison: `${parseFloat(((todaySlaData.data._42_simple_three_events_or_validation_pass_until_now * 100) / todaySlaData.data._42_scheduled_rides_until_now).toFixed(2))}%`,
	// 		missed: todaySlaData.data._42_scheduled_rides_until_now - todaySlaData.data._42_simple_three_events_pass_until_now,
	// 		total: todaySlaData.data._42_scheduled_rides_until_now,
	// 	};
	// }, [todaySlaData]);

	// const today43SlaParsed = useMemo(() => {
	// 	if (!todaySlaData) return { comparison: 0, missed: 0, total: 0 };
	// 	return {
	// 		comparison: `${parseFloat(((todaySlaData.data._43_simple_three_events_or_validation_pass_until_now * 100) / todaySlaData.data._43_scheduled_rides_until_now).toFixed(2))}%`,
	// 		missed: todaySlaData.data._43_scheduled_rides_until_now - todaySlaData.data._43_simple_three_events_pass_until_now,
	// 		total: todaySlaData.data._43_scheduled_rides_until_now,
	// 	};
	// }, [todaySlaData]);

	// const today44SlaParsed = useMemo(() => {
	// 	if (!todaySlaData) return { comparison: 0, missed: 0, total: 0 };
	// 	return {
	// 		comparison: `${parseFloat(((todaySlaData.data._44_simple_three_events_or_validation_pass_until_now * 100) / todaySlaData.data._44_scheduled_rides_until_now).toFixed(2))}%`,
	// 		missed: todaySlaData.data._44_scheduled_rides_until_now - todaySlaData.data._44_simple_three_events_pass_until_now,
	// 		total: todaySlaData.data._44_scheduled_rides_until_now,
	// 	};
	// }, [todaySlaData]);

	//
	// D. Render components

	return (
		<ScreenWrapper>
			<DefaultCard
				icon={<IconCircleCheckFilled />}
				isLoading={todaySlaLoading}
				isValidating={todaySlaValidating}
				sentiment="bad"
				timestamp={todaySlaData?.timestamp}
				title="CM / Viagens não executadas hoje até agora"
				valuePrimary={todayCmSlaParsed.missed}
				valueSecondary={todayCmSlaParsed.total}
			/>
			<DefaultCard
				icon={<IconCircleCheckFilled />}
				isLoading={todaySlaLoading}
				isValidating={todaySlaValidating}
				sentiment="normal"
				timestamp={todaySlaData?.timestamp}
				title="CM / Viagens não executadas hoje até agora"
				valuePrimary={todayCmSlaParsed.missed}
				valueSecondary={todayCmSlaParsed.total}
			/>
			<DefaultCard
				icon={<IconCircleCheckFilled />}
				isLoading={todaySlaLoading}
				isValidating={todaySlaValidating}
				sentiment="good"
				timestamp={todaySlaData?.timestamp}
				title="CM / Viagens não executadas hoje até agora"
				valuePrimary={todayCmSlaParsed.missed}
				valueSecondary={todayCmSlaParsed.total}
			/>
			<DefaultCard
				icon={<IconCircleCheckFilled />}
				isLoading={todaySlaLoading}
				isValidating={todaySlaValidating}
				sentiment="bad"
				timestamp={todaySlaData?.timestamp}
				title="CM / Viagens não executadas hoje até agora"
				valuePrimary={todayCmSlaParsed.missed}
				valueSecondary={todayCmSlaParsed.total}
			/>
			<DefaultCard
				icon={<IconCircleCheckFilled />}
				isLoading={todaySlaLoading}
				isValidating={todaySlaValidating}
				sentiment="bad"
				timestamp={todaySlaData?.timestamp}
				title="CM / Viagens não executadas hoje até agora"
				valuePrimary={todayCmSlaParsed.missed}
				valueSecondary={todayCmSlaParsed.total}
			/>
			{/* <Columns cols={2}>
				<CardSummary
					bigNumber={today41SlaParsed.missed}
					comparison={today41SlaParsed.total}
					isLoading={todaySlaLoading}
					isValidating={todaySlaValidating}
					level={2}
					timestamp={todaySlaData?.timestamp}
					title="41 / Viagens não executadas hoje até agora"
				/>
				<CardSummary
					bigNumber={today42SlaParsed.missed}
					comparison={today42SlaParsed.total}
					isLoading={todaySlaLoading}
					isValidating={todaySlaValidating}
					level={2}
					timestamp={todaySlaData?.timestamp}
					title="42 / Viagens não executadas hoje até agora"
				/>
				<CardSummary
					bigNumber={today43SlaParsed.missed}
					comparison={today43SlaParsed.total}
					isLoading={todaySlaLoading}
					isValidating={todaySlaValidating}
					level={2}
					timestamp={todaySlaData?.timestamp}
					title="43 / Viagens não executadas hoje até agora"
				/>
				<CardSummary
					bigNumber={today44SlaParsed.missed}
					comparison={today44SlaParsed.total}
					isLoading={todaySlaLoading}
					isValidating={todaySlaValidating}
					level={2}
					timestamp={todaySlaData?.timestamp}
					title="44 / Viagens não executadas hoje até agora"
				/>
			</Columns> */}
		</ScreenWrapper>
	);

	//
}
