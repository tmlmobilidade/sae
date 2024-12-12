'use client';

/* * */

import { CardSummary } from '@/components/cards/CardSummary';
import { Columns } from '@/components/layout/Columns';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { OPERATIONAL_DATE_FORMAT } from '@tmlmobilidade/services/types';
import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import useSWR from 'swr';

/* * */

export function Screen1() {
	//

	//
	// A. Setup variables

	const todayOperationalDate = getOperationalDate();
	const lastWeekOperationalDate = getOperationalDate(DateTime.fromFormat(todayOperationalDate, OPERATIONAL_DATE_FORMAT).minus({ days: 7 }));

	//
	// B. Fetch data

	const { data: todayPaxCmData, isLoading: todayPaxCmLoading, isValidating: todayPaxCmValidating } = useSWR(`/api/validations/cm/${todayOperationalDate}`);
	const { data: lastWeekPaxCmData, isLoading: lastWeekPaxCmLoading, isValidating: lastWeekPaxCmValidating } = useSWR(`/api/validations/cm/${lastWeekOperationalDate}`);

	const { data: todayPax41Data, isLoading: todayPax41Loading, isValidating: todayPax41Validating } = useSWR(`/api/validations/41/${todayOperationalDate}`);
	const { data: lastWeekPax41Data, isLoading: lastWeekPax41Loading, isValidating: lastWeekPax41Validating } = useSWR(`/api/validations/41/${lastWeekOperationalDate}`);

	const { data: todayPax42Data, isLoading: todayPax42Loading, isValidating: todayPax42Validating } = useSWR(`/api/validations/42/${todayOperationalDate}`);
	const { data: lastWeekPax42Data, isLoading: lastWeekPax42Loading, isValidating: lastWeekPax42Validating } = useSWR(`/api/validations/42/${lastWeekOperationalDate}`);

	const { data: todayPax43Data, isLoading: todayPax43Loading, isValidating: todayPax43Validating } = useSWR(`/api/validations/43/${todayOperationalDate}`);
	const { data: lastWeekPax43Data, isLoading: lastWeekPax43Loading, isValidating: lastWeekPax43Validating } = useSWR(`/api/validations/43/${lastWeekOperationalDate}`);

	const { data: todayPax44Data, isLoading: todayPax44Loading, isValidating: todayPax44Validating } = useSWR(`/api/validations/44/${todayOperationalDate}`);
	const { data: lastWeekPax44Data, isLoading: lastWeekPax44Loading, isValidating: lastWeekPax44Validating } = useSWR(`/api/validations/44/${lastWeekOperationalDate}`);

	//
	// C. Transform data

	const paxCmSummaryDataFormatted = useMemo(() => {
		if (!todayPaxCmData || !lastWeekPaxCmData) return {};
		return {
			big_number: todayPaxCmData.value,
			comparisson: (todayPaxCmData.value * 100) / lastWeekPaxCmData.value,
		};
	}, [lastWeekPaxCmData, todayPaxCmData]);

	const pax41SummaryDataFormatted = useMemo(() => {
		if (!todayPax41Data || !lastWeekPax41Data) return {};
		return {
			big_number: todayPax41Data.value,
			comparisson: (todayPax41Data.value * 100) / lastWeekPax41Data.value,
		};
	}, [lastWeekPax41Data, todayPax41Data]);

	const pax42SummaryDataFormatted = useMemo(() => {
		if (!todayPax42Data || !lastWeekPax42Data) return {};
		return {
			big_number: todayPax42Data.value,
			comparisson: (todayPax42Data.value * 100) / lastWeekPax42Data.value,
		};
	}, [lastWeekPax42Data, todayPax42Data]);

	const pax43SummaryDataFormatted = useMemo(() => {
		if (!todayPax43Data || !lastWeekPax43Data) return {};
		return {
			big_number: todayPax43Data.value,
			comparisson: (todayPax43Data.value * 100) / lastWeekPax43Data.value,
		};
	}, [lastWeekPax43Data, todayPax43Data]);

	const pax44SummaryDataFormatted = useMemo(() => {
		if (!todayPax44Data || !lastWeekPax44Data) return {};
		return {
			big_number: todayPax44Data.value,
			comparisson: (todayPax44Data.value * 100) / lastWeekPax44Data.value,
		};
	}, [lastWeekPax44Data, todayPax44Data]);

	//
	// A. Render components

	return (
		<ScreenWrapper>
			<Columns cols={1}>
				<CardSummary
					bigNumber={paxCmSummaryDataFormatted.big_number}
					comparison={paxCmSummaryDataFormatted.comparisson}
					endDate={todayPaxCmData?.end_date}
					isLoading={todayPaxCmLoading || lastWeekPaxCmLoading}
					isValidating={todayPaxCmValidating || lastWeekPaxCmValidating}
					level={1}
					startDate={todayPaxCmData?.start_date}
					timestamp={todayPaxCmData?.timestamp}
					title="CM / Total de Validações Hoje"
				/>
			</Columns>
			<Columns cols={2}>
				<CardSummary
					bigNumber={pax41SummaryDataFormatted.big_number}
					comparison={pax41SummaryDataFormatted.comparisson}
					endDate={todayPax41Data?.end_date}
					isLoading={todayPax41Loading || lastWeekPax41Loading}
					isValidating={todayPax41Validating || lastWeekPax41Validating}
					level={2}
					startDate={todayPax41Data?.start_date}
					timestamp={todayPax41Data?.timestamp}
					title="Área 1 / Total de Validações Hoje"
				/>
				<CardSummary
					bigNumber={pax42SummaryDataFormatted.big_number}
					comparison={pax42SummaryDataFormatted.comparisson}
					endDate={todayPax42Data?.end_date}
					isLoading={todayPax42Loading || lastWeekPax42Loading}
					isValidating={todayPax42Validating || lastWeekPax42Validating}
					level={2}
					startDate={todayPax42Data?.start_date}
					timestamp={todayPax42Data?.timestamp}
					title="Área 2 / Total de Validações Hoje"
				/>
				<CardSummary
					bigNumber={pax43SummaryDataFormatted.big_number}
					comparison={pax43SummaryDataFormatted.comparisson}
					endDate={todayPax43Data?.end_date}
					isLoading={todayPax43Loading || lastWeekPax43Loading}
					isValidating={todayPax43Validating || lastWeekPax43Validating}
					level={2}
					startDate={todayPax43Data?.start_date}
					timestamp={todayPax43Data?.timestamp}
					title="Área 3 / Total de Validações Hoje"
				/>
				<CardSummary
					bigNumber={pax44SummaryDataFormatted.big_number}
					comparison={pax44SummaryDataFormatted.comparisson}
					endDate={todayPax44Data?.end_date}
					isLoading={todayPax44Loading || lastWeekPax44Loading}
					isValidating={todayPax44Validating || lastWeekPax44Validating}
					level={2}
					startDate={todayPax44Data?.start_date}
					timestamp={todayPax44Data?.timestamp}
					title="Área 4 / Total de Validações Hoje"
				/>
			</Columns>
		</ScreenWrapper>
	);

	//
}