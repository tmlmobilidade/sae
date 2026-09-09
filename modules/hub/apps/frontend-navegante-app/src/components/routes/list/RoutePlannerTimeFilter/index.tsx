'use client';

import { RoutePlannerFilterButton } from '@/components/routes/list/RoutePlannerFilterButton';
import { RoutePlannerFilterPanel } from '@/components/routes/list/RoutePlannerFilterPanel';
import { useRoutePlannerContext } from '@/components/routes/RoutePlanner.context';
import { type RoutePlannerTravelTime, type RoutePlannerTravelTimeMode } from '@/types/route-planner/models';
import { formatDateTimeLocalInputValue } from '@/utils/route-planner/presentation/format';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

/* * */

interface RoutePlannerTimeFilterProps {
	onClose: () => void
}

/* * */

export function RoutePlannerTimeFilter({ onClose }: RoutePlannerTimeFilterProps) {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();
	const routePlannerContext = useRoutePlannerContext();

	//
	// B. Handle actions

	const handleTravelTimeModeChange = (mode: RoutePlannerTravelTimeMode) => {
		const nextTravelTime: RoutePlannerTravelTime = {
			date: mode === 'now' || routePlannerContext.data.travel_time.mode === 'now' ? new Date() : routePlannerContext.data.travel_time.date,
			mode,
		};

		routePlannerContext.actions.setTravelTimeMode(mode);
		void routePlannerContext.actions.planRoute({ destination: routePlannerContext.data.destination, origin: routePlannerContext.data.origin, travelTime: nextTravelTime });

		if (mode === 'now') onClose();
	};

	const handleTravelTimeChange = (value: string) => {
		const parsedDate = new Date(value);
		if (Number.isNaN(parsedDate.getTime())) return;

		const nextTravelTime: RoutePlannerTravelTime = {
			date: parsedDate,
			mode: routePlannerContext.data.travel_time.mode,
		};

		routePlannerContext.actions.setTravelTime(parsedDate);
		void routePlannerContext.actions.planRoute({ destination: routePlannerContext.data.destination, origin: routePlannerContext.data.origin, travelTime: nextTravelTime });
	};

	//
	// C. Render components

	return (
		<RoutePlannerFilterPanel
			label={t('default:routes.RoutePlannerInput.time.datetime_label')}
			footer={routePlannerContext.data.travel_time.mode !== 'now' && (
				<input
					className={styles.timeInput}
					onChange={event => handleTravelTimeChange(event.currentTarget.value)}
					type="datetime-local"
					value={formatDateTimeLocalInputValue(routePlannerContext.data.travel_time.date)}
				/>
			)}
		>
			<RoutePlannerFilterButton
				isActive={routePlannerContext.data.travel_time.mode === 'now'}
				onClick={() => handleTravelTimeModeChange('now')}
			>
				{t('default:routes.RoutePlannerInput.time.now')}
			</RoutePlannerFilterButton>
			<RoutePlannerFilterButton
				isActive={routePlannerContext.data.travel_time.mode === 'departure'}
				onClick={() => handleTravelTimeModeChange('departure')}
			>
				{t('default:routes.RoutePlannerInput.time.departure')}
			</RoutePlannerFilterButton>
			<RoutePlannerFilterButton
				isActive={routePlannerContext.data.travel_time.mode === 'arrival'}
				onClick={() => handleTravelTimeModeChange('arrival')}
			>
				{t('default:routes.RoutePlannerInput.time.arrival')}
			</RoutePlannerFilterButton>
		</RoutePlannerFilterPanel>
	);

	//
}
