'use client';

import { LineDisplay } from '@/components/lines/common/LineDisplay';
import { StopsDetailViewTimetableClock } from '@/components/stops/detail/StopsDetailViewTimetableClock';
import { StopsDetailViewTimetableRowArrival } from '@/components/stops/detail/StopsDetailViewTimetableRowArrival';
import { type StopsDetailViewTimetableData } from '@/components/stops/detail/use-stop-detail-data';
import { useSelectedTrip } from '@/hooks/transit/useSelectedTrip';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

/* * */

interface StopsDetailViewTimetableRowProps {
	data: StopsDetailViewTimetableData
	withClock: boolean
}

/* * */

export function StopsDetailViewTimetableRow({ data, withClock }: StopsDetailViewTimetableRowProps) {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const { selectedTripData, setSelectedTrip } = useSelectedTrip();

	//
	// B. Transform data

	const isSelected = useMemo(() => {
		const isSamePatternId = selectedTripData.patternId === data.pattern_id;
		const isSameTripId = selectedTripData.tripId === data.trip_ids[0];
		const isSameStopSequence = selectedTripData.stopSequence === data.stop_sequence;
		return isSamePatternId && isSameTripId && isSameStopSequence;
	}, [selectedTripData, data]);

	//
	// C. Handle actions

	const handleClick = () => {
		setSelectedTrip(data.pattern_id, data.trip_ids[0], data.stop_sequence);
	};

	//
	// D. Render components

	return (
		<>

			{withClock && (
				<div className={styles.clockWrapper}>
					<StopsDetailViewTimetableClock />
				</div>
			)}

			<div
				className={styles.container}
				data-is-past={data.is_past}
				data-is-selected={isSelected}
				data-with-clock={withClock}
				onClick={handleClick}
			>

				<div className={styles.summary}>
					<LineDisplay
						agencyId={data.agency_id}
						color={data.color}
						longName={data.headsign}
						shortName={data.short_name}
						textColor={data.text_color}
					/>
					<StopsDetailViewTimetableRowArrival data={data} />
				</div>

				{data.locality_names?.length > 0 && (
					<div className={styles.details}>
						<p className={styles.localitiesList}>{t('default:stops.StopsDetailViewTimetableRow.localities', '', { localities: data.locality_names.join(', ') })}</p>
						{/* <pre
							onClick={e => e.stopPropagation()}
							style={{ overflow: 'auto', userSelect: 'text', width: '100%' }}
						>
							{JSON.stringify(data, null, 2)}
						</pre> */}
					</div>
				)}

			</div>

		</>
	);
}
