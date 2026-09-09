/* * */

import { useLinesDetailContext } from '@/components/lines/detail/LinesDetail.context';
import { type Hour, type Minute, type Timetable } from '@tmlmobilidade/go-types-hub';
import { useColorScheme } from '@tmlmobilidade/ui';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

/* * */

interface TimetableSchedulesMinuteProps {
	hourData: Hour
	isHighlighted: boolean
	minuteData: Minute
	onClick?: () => void
	selectedExceptionIds: string[]
	setSelectedExceptionIds: (values: string[]) => void
}

interface TimetableSchedulesProps {
	selectedExceptionIds: string[]
	setSelectedExceptionIds: (values: string[]) => void
	timetableData: Timetable
}

/* * */

export function TimetableSchedules({ selectedExceptionIds, setSelectedExceptionIds, timetableData }: TimetableSchedulesProps) {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();
	const linesDetailContext = useLinesDetailContext();

	//
	// B. Render components

	return (
		<div className={styles.container}>
			<div className={styles.column}>
				<p aria-hidden={true} className={styles.hour}>{t('default:lines.TimetableSchedules.hours')}</p>
				<p aria-hidden={true} className={styles.minute}>{t('default:lines.TimetableSchedules.minutes')}</p>
			</div>
			{timetableData.hours.map(hourData => (
				<div key={hourData.hour_value} className={styles.column}>
					<p aria-hidden={true} className={styles.hour}>{hourData.hour_label}</p>
					{hourData.minutes.map(minuteData => (
						<TimetableSchedulesMinute
							key={minuteData.minute_value}
							hourData={hourData}
							isHighlighted={Boolean(linesDetailContext.data.highlighted_trip_ids && minuteData.trip_ids.some(tripId => linesDetailContext.data.highlighted_trip_ids?.includes(tripId)))}
							minuteData={minuteData}
							onClick={() => linesDetailContext.actions.setHighlightedTripIds(minuteData.trip_ids)}
							selectedExceptionIds={selectedExceptionIds}
							setSelectedExceptionIds={setSelectedExceptionIds}
						/>
					))}
				</div>
			))}
		</div>
	);

	//
}

/* * */

function TimetableSchedulesMinute({ hourData, isHighlighted, minuteData, onClick, selectedExceptionIds, setSelectedExceptionIds }: TimetableSchedulesMinuteProps) {
	//

	//
	// A. Transform data

	const isSelected = selectedExceptionIds.some(exceptionId => minuteData.exception_ids.includes(exceptionId));
	const isDark = useColorScheme();
	const { t } = useTranslation();

	//
	// B. Handle actions

	const handleMouseOverException = () => {
		setSelectedExceptionIds(minuteData.exception_ids);
	};

	const handleMouseOutException = () => {
		setSelectedExceptionIds([]);
	};

	//
	// C. Render components

	return (
		<p
			key={minuteData.minute_value}
			aria-label={t('default:lines.TimetableSchedules.timestamp', '', { hour: hourData.hour_label, minute: minuteData.minute_label })}
			className={`${styles.minute} ${minuteData.exception_ids.length > 0 && styles.withException} ${isSelected && styles.isSelected} ${!isSelected && selectedExceptionIds.length > 0 && styles.isOthersSelected} ${isHighlighted && styles.isHighlighted}`}
			data-is-dark={isDark === 'dark' ? 'true' : 'false'}
			onClick={onClick}
			onMouseOut={handleMouseOutException}
			onMouseOver={handleMouseOverException}
			role="text"
		>
			{minuteData.minute_label}
			{minuteData.exception_ids.length > 0 && minuteData.exception_ids.map(exceptionId => (
				<span key={exceptionId} className={styles.exception}>
					{exceptionId}
				</span>
			))}
		</p>
	);

	//
}
