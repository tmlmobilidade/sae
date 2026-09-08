'use client';

import { useAlertsData } from '@/components/alerts/use-alerts-data';
import { RoutePlannerItineraryLegStrip } from '@/components/routes/common/RoutePlannerItineraryLegStrip';
import { RoutePlannerTime } from '@/components/routes/common/RoutePlannerTime';
import { getRoutePlannerLegPlaceName, RoutePlannerItineraryDetailLeg } from '@/components/routes/detail/RoutePlannerItineraryDetailLeg';
import { useRoutePlannerContext } from '@/components/routes/RoutePlanner.context';
import { useLinesByShortName } from '@/hooks/route-planner/useLinesByShortName';
import { useRoutePlannerActiveLeg } from '@/hooks/route-planner/useRoutePlannerActiveLeg';
import { getRoutePlannerItineraryRealtimeStatus } from '@/utils/route-planner/itinerary/realtime';
import { getMotisItineraryDurationSeconds, getMotisItineraryEnd } from '@/utils/route-planner/planning/motis-plan-api';
import { formatMotisPlanDuration } from '@/utils/route-planner/presentation/format';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

/* * */

export function RoutePlannerItineraryDetail() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();
	const { data: alerts } = useAlertsData();
	const lineByShortName = useLinesByShortName();
	const routePlannerContext = useRoutePlannerContext();
	const { activeLegIndex } = useRoutePlannerActiveLeg();

	//
	// B. Transform data

	const itinerary = routePlannerContext.data.selected_itinerary;
	const isNavigating = routePlannerContext.flags.is_navigating;
	const legs = useMemo(() => Array.isArray(itinerary?.legs) ? itinerary.legs : [], [itinerary?.legs]);
	const duration = itinerary ? formatMotisPlanDuration(getMotisItineraryDurationSeconds(itinerary)) : null;
	const end = itinerary ? getMotisItineraryEnd(itinerary) : undefined;
	const routeDestinationLabel = routePlannerContext.data.destination?.label ?? t('default:routes.RoutePlanner.results.destination');
	const routeOriginLabel = routePlannerContext.data.origin?.label ?? t('default:routes.RoutePlanner.results.origin');
	const realtimeStatus = useMemo(() => {
		return getRoutePlannerItineraryRealtimeStatus(legs);
	}, [legs]);
	const effectiveEnd = realtimeStatus.end_time?.effective_time ?? end;
	const plannedEnd = realtimeStatus.end_time?.planned_time ?? end;
	const arrivalTime = {
		effective_time: effectiveEnd,
		is_realtime: realtimeStatus.is_realtime,
		planned_time: plannedEnd,
	};

	//
	// C. Render components

	if (!itinerary) return null;

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<strong className={styles.duration}>
					{duration || t('default:routes.RoutePlanner.results.duration_unavailable')}
				</strong>
				<span className={styles.arrival}>
					<span>{t('default:routes.RoutePlanner.results.arrival_time_prefix')}</span>
					<RoutePlannerTime time={arrivalTime} />
				</span>
				<RoutePlannerItineraryLegStrip itinerary={itinerary} />
			</header>

			{isNavigating && (
				<div className={styles.actions}>
					<button
						className={styles.endButton}
						onClick={routePlannerContext.actions.endActiveTrip}
						type="button"
					>
						{t('default:routes.RoutePlanner.results.end_trip')}
					</button>
				</div>
			)}

			<ol className={styles.timeline}>
				{legs.map((leg, index) => (
					<RoutePlannerItineraryDetailLeg
						key={`${getRoutePlannerLegPlaceName(leg.from, routeOriginLabel, routeOriginLabel, routeDestinationLabel)}-${getRoutePlannerLegPlaceName(leg.to, routeDestinationLabel, routeOriginLabel, routeDestinationLabel)}-${index}`}
						alerts={alerts}
						isActive={isNavigating && index === activeLegIndex}
						leg={leg}
						lineByShortName={lineByShortName}
						routeDestinationLabel={routeDestinationLabel}
						routeOriginLabel={routeOriginLabel}
					/>
				))}
			</ol>
		</div>
	);

	//
}
