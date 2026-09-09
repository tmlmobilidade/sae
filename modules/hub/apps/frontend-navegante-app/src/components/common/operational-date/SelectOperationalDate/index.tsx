'use client';

import { useOperationalDate } from '@/hooks/transit/useOperationalDate';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { DatePicker, Modal, SegmentedControl } from '@tmlmobilidade/ui';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

/* * */

export function SelectOperationalDate() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const [modalIsOpen, setModalIsOpen] = useState(false);

	const { isTodaySelected, isTomorrowSelected, selectedOperationalDate, setOperationalDateFromFormat, setOperationalDateToToday, setOperationalDateToTomorrow } = useOperationalDate();

	//
	// B. Transform data

	const selectedOperationalDateDisplay = useMemo(() => {
		return Dates
			.fromOperationalDateInt(selectedOperationalDate, 'Europe/Lisbon')
			.set({ hour: 15 })
			.toFormat('d MMM yy');
	}, [selectedOperationalDate]);

	const selectedOperationalDatePicker = useMemo(() => {
		return Dates
			.fromOperationalDateInt(selectedOperationalDate, 'Europe/Lisbon')
			.set({ hour: 15 })
			.toFormat('yyyy-MM-dd');
	}, [selectedOperationalDate]);

	const segementedControlOptions = useMemo(() => [
		{ label: t('default:lines.SelectOperationalDate.today'), value: 'today' },
		{ label: t('default:lines.SelectOperationalDate.tomorrow'), value: 'tomorrow' },
		{ label: <span onClick={() => setModalIsOpen(true)}>{selectedOperationalDateDisplay}</span>, value: 'custom_date' },
	], [selectedOperationalDateDisplay, t]);

	const selectedSegmentedControlOption = useMemo(() => {
		if (isTodaySelected) return 'today';
		if (isTomorrowSelected) return 'tomorrow';
		if (!isTodaySelected && !isTomorrowSelected) return 'custom_date';
		return undefined;
	}, [isTodaySelected, isTomorrowSelected]);

	//
	// C. Handle actions

	const handleSegmentedControlChange = (value: string) => {
		if (value === 'today') setOperationalDateToToday();
		else if (value === 'tomorrow') setOperationalDateToTomorrow();
		else if (value === 'custom_date') setModalIsOpen(true);
	};

	const handleSelectOperationalDateFromModal = (value: string) => {
		setOperationalDateFromFormat(value, 'yyyy-MM-dd');
		setModalIsOpen(false);
	};

	//
	// D. Render components

	return (
		<>

			<Modal
				onClose={() => setModalIsOpen(false)}
				opened={modalIsOpen}
				padding={0}
				size="auto"
				withCloseButton={false}
			>
				<DatePicker
					onChange={handleSelectOperationalDateFromModal}
					size="lg"
					value={selectedOperationalDatePicker}
				/>
			</Modal>

			<SegmentedControl
				data={segementedControlOptions}
				onChange={handleSegmentedControlChange}
				size="md"
				value={selectedSegmentedControlOption}
				w="100%"
				classNames={{
					control: styles.segmentedControlDateInputOverrideControl,
					label: styles.segmentedControlDateInputOverrideLabel,
				}}
			/>

		</>
	);
}
