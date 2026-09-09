'use client';

import { type OperationalDateInt, OperationalDateIntSchema } from '@tmlmobilidade/go-types-shared';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { useSessionStorage } from '@tmlmobilidade/ui';
import { useMemo } from 'react';

/* * */

interface UseOperationalDateReturnType {
	isTodaySelected: boolean
	isTomorrowSelected: boolean
	selectedOperationalDate: OperationalDateInt
	selectedOperationalDateAsJsDate: Date | null
	setOperationalDate: (value: OperationalDateInt) => void
	setOperationalDateFromFormat: (value: string, format?: string) => void
	setOperationalDateFromJsDate: (value: Date) => void
	setOperationalDateToToday: () => void
	setOperationalDateToTomorrow: () => void
	todayOperationalDate: OperationalDateInt
	tomorrowOperationalDate: OperationalDateInt
}

/**
 * A hook that provides the operational date, flags,
 * and a set of functions to set it.
 */
export function useOperationalDate(): UseOperationalDateReturnType {
	//

	//
	// A. Setup variables

	const [storedOperationalDate, setSelectedOperationalDate] = useSessionStorage<OperationalDateInt | string>({
		defaultValue: Dates.now('Europe/Lisbon').operational_date_int,
		key: 'operational-date',
	});
	const selectedOperationalDate = OperationalDateIntSchema.parse(storedOperationalDate);

	//
	// B. Transform data

	const todayOperationalDate = useMemo(() => {
		return Dates.now('Europe/Lisbon').operational_date_int;
	}, []);

	const tomorrowOperationalDate = useMemo(() => {
		return Dates.now('Europe/Lisbon').plus({ days: 1 }).operational_date_int;
	}, []);

	const isTodaySelected = useMemo(() => {
		return selectedOperationalDate === todayOperationalDate;
	}, [selectedOperationalDate, todayOperationalDate]);

	const isTomorrowSelected = useMemo(() => {
		return selectedOperationalDate === tomorrowOperationalDate;
	}, [selectedOperationalDate, tomorrowOperationalDate]);

	const selectedOperationalDateAsJsDate = useMemo(() => {
		return Dates
			.fromOperationalDateInt(selectedOperationalDate, 'Europe/Lisbon')
			.set({ hour: 15 })
			.js_date;
	}, [selectedOperationalDate]);

	//
	// C. Handle actions

	const setOperationalDate = (value: OperationalDateInt) => {
		const operationalDateValue = Dates
			.fromOperationalDateInt(value, 'Europe/Lisbon')
			.set({ hour: 15 })
			.operational_date_int;
		setSelectedOperationalDate(operationalDateValue);
	};

	const setOperationalDateFromFormat = (value: string, format = 'yyyy-MM-dd') => {
		const operationalDateValue = Dates
			.fromFormat(value, format, 'Europe/Lisbon')
			.set({ hour: 15 })
			.operational_date_int;
		setSelectedOperationalDate(operationalDateValue);
	};

	const setOperationalDateFromJsDate = (value: Date) => {
		const operationalDateValue = Dates
			.fromJSDate(value)
			.set({ hour: 15 })
			.operational_date_int;
		setSelectedOperationalDate(operationalDateValue);
	};

	const setOperationalDateToToday = () => {
		setSelectedOperationalDate(todayOperationalDate);
	};

	const setOperationalDateToTomorrow = () => {
		setSelectedOperationalDate(tomorrowOperationalDate);
	};

	//
	// D. Return data

	return {
		isTodaySelected,
		isTomorrowSelected,
		selectedOperationalDate,
		selectedOperationalDateAsJsDate,
		setOperationalDate,
		setOperationalDateFromFormat,
		setOperationalDateFromJsDate,
		setOperationalDateToToday,
		setOperationalDateToTomorrow,
		todayOperationalDate,
		tomorrowOperationalDate,
	};
}
