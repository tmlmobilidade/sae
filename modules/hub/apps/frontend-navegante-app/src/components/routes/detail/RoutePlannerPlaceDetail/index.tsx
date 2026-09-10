'use client';

import { RoutePlannerItineraryCard } from '@/components/routes/list/RoutePlannerItineraryCard';
import { useRoutePlannerContext } from '@/components/routes/RoutePlanner.context';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

/* * */

export function RoutePlannerPlaceDetail() {
	//

	// A. Setup variables

	const { t } = useTranslation();
	const routePlannerContext = useRoutePlannerContext();
	const destination = routePlannerContext.data.destination;
	const origin = routePlannerContext.data.origin;

	//
	// B. Render components

	return (
		<div className={styles.container}>
			<div className={styles.placeHeader}>
				<h2>{destination?.label}</h2>
				{destination?.detail && <p>{destination.detail}</p>}
			</div>

			<h3>{t('default:routes.RoutePlanner.place_detail.how_to_get_here')}</h3>
			{!origin && <p className={styles.status}>{t('default:routes.RoutePlanner.place_detail.select_origin')}</p>}
			{routePlannerContext.flags.is_planning && <p>{t('default:routes.RoutePlanner.actions.planning')}</p>}
			{routePlannerContext.data.plan_error && <p className={styles.error}>{routePlannerContext.data.plan_error}</p>}
			<div className={styles.itineraries}>
				{routePlannerContext.data.itineraries.map((itinerary, index) => (
					<RoutePlannerItineraryCard
						key={`${itinerary.startTime || index}-${itinerary.endTime || index}`}
						itinerary={itinerary}
						onSelect={() => routePlannerContext.actions.selectItinerary(index)}
					/>
				))}
			</div>
		</div>
	);
}
