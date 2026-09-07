'use client';

import { useAlertsContext } from '@/components/alerts/Alerts.context';
import { RoutePlannerLinePill } from '@/components/routes/common/RoutePlannerLinePill';
import { RoutePlannerModeBadge } from '@/components/routes/common/RoutePlannerModeBadge';
import { RoutePlannerTime } from '@/components/routes/common/RoutePlannerTime';
import { type MotisPlanIntermediateStop, type MotisPlanLeg } from '@/types/route-planner/models';
import { filterAlertsByRoutePlannerItinerary, getRoutePlannerItineraryAlertFilters } from '@/utils/route-planner/itinerary/alerts';
import { getRoutePlannerIntermediateStopRealtimeStatus, getRoutePlannerLegRealtimeStatus } from '@/utils/route-planner/itinerary/realtime';
import { getMotisLegDurationSeconds } from '@/utils/route-planner/planning/motis-plan-api';
import { formatMotisPlanDurationMinutes } from '@/utils/route-planner/presentation/format';
import { isMotisWalkingLeg } from '@/utils/route-planner/presentation/modes';
import { IconAlertTriangle, IconChevronDown, IconNavigationTop } from '@tabler/icons-react';
import { type HubLine } from '@tmlmobilidade/go-types-hub';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

/* * */

interface RoutePlannerItineraryDetailLegProps {
	alertsContext: ReturnType<typeof useAlertsContext>
	isActive: boolean
	leg: MotisPlanLeg
	lineByShortName: Map<string, HubLine>
	routeDestinationLabel: string
	routeOriginLabel: string
}

/* * */

export function RoutePlannerItineraryDetailLeg({ alertsContext, isActive, leg, lineByShortName, routeDestinationLabel, routeOriginLabel }: RoutePlannerItineraryDetailLegProps) {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();
	const [isStopsExpanded, setIsStopsExpanded] = useState(false);

	//
	// B. Transform data

	const from = getRoutePlannerLegPlaceName(leg.from, routeOriginLabel, routeOriginLabel, routeDestinationLabel);
	const to = getRoutePlannerLegPlaceName(leg.to, routeDestinationLabel, routeOriginLabel, routeDestinationLabel);
	const durationMinutes = formatMotisPlanDurationMinutes(getMotisLegDurationSeconds(leg));
	const intermediateStops = getIntermediateStops(leg);
	const hasIntermediateStops = intermediateStops.length > 0;
	const realtimeStatus = getRoutePlannerLegRealtimeStatus(leg);
	const delaySeconds = realtimeStatus.delay_seconds;
	const legAlertFilters = useMemo(() => {
		if (isMotisWalkingLeg(leg)) return null;
		return getRoutePlannerItineraryAlertFilters({ legs: [leg] }, Array.from(lineByShortName.values()));
	}, [leg, lineByShortName]);

	const alerts = useMemo(() => {
		if (isMotisWalkingLeg(leg)) return [];
		return filterAlertsByRoutePlannerItinerary(alertsContext.data.alerts, legAlertFilters);
	}, [alertsContext.data.alerts, leg, legAlertFilters]);

	//
	// C. Render components

	return (
		<li aria-current={isActive ? 'step' : undefined} className={styles.leg}>
			<RoutePlannerModeBadge
				leg={leg}
				size="md"
				marker={isActive && (
					<span
						aria-label={t('default:routes.RoutePlanner.results.current_step')}
						className={styles.currentStepMarker}
						role="img"
					>
						<IconNavigationTop size={12} stroke={3} />
					</span>
				)}
			/>

			<div className={styles.legBody}>
				<div className={styles.legHeader}>
					<RoutePlannerLinePill leg={leg} lineByShortName={lineByShortName} size="md" />
					{durationMinutes !== null && (
						<span className={styles.durationChip}>
							{t('default:routes.RoutePlanner.results.leg_duration', '', { count: durationMinutes })}
						</span>
					)}
				</div>

				{isMotisWalkingLeg(leg) ? (
					<p className={styles.instruction}>
						{t('default:routes.RoutePlanner.results.walk_between', '', { from, to })}
					</p>
				) : (
					<>
						<p className={styles.instruction}>
							{t('default:routes.RoutePlanner.results.ride_between', '', { from, to })}
						</p>
						{leg.headsign && <p className={styles.headsign}>{leg.headsign}</p>}
					</>
				)}

				<div className={styles.legEndpoints}>
					<span><RoutePlannerTime time={realtimeStatus.from_time} /> · {from}</span>
					<span><RoutePlannerTime time={realtimeStatus.to_time} /> · {to}</span>
				</div>

				{(delaySeconds !== 0 || alerts.length > 0) && (
					<div className={styles.warningList}>
						{delaySeconds !== 0 && (
							<div className={styles.warningItem} data-kind={delaySeconds > 0 ? 'late' : 'early'}>
								<IconAlertTriangle size={15} />
								<span>
									{t(delaySeconds > 0
										? 'default:routes.RoutePlanner.results.delay'
										: 'default:routes.RoutePlanner.results.early', '', {
										count: Math.max(1, Math.round(Math.abs(delaySeconds) / 60)),
									})}
								</span>
							</div>
						)}

						{alerts.slice(0, 3).map(alert => (
							<div key={alert._id} className={styles.warningItem} data-kind="alert">
								<IconAlertTriangle size={15} />
								<span>{alert.title}</span>
							</div>
						))}
					</div>
				)}

				{hasIntermediateStops && (
					<div className={styles.stops}>
						<button
							aria-expanded={isStopsExpanded}
							className={styles.stopsButton}
							onClick={() => setIsStopsExpanded(current => !current)}
							type="button"
						>
							{t('default:routes.RoutePlanner.results.intermediate_stops', '', { count: intermediateStops.length })}
							<IconChevronDown size={16} />
						</button>

						{isStopsExpanded && (
							<ol className={styles.stopList}>
								{intermediateStops.map((stop, index) => (
									<li key={`${getStopName(stop)}-${index}`}>
										<RoutePlannerTime time={getRoutePlannerIntermediateStopRealtimeStatus(stop, leg.realTime)} />
										<strong>{getStopName(stop)}</strong>
									</li>
								))}
							</ol>
						)}
					</div>
				)}
			</div>
		</li>
	);

	//
}

/* * */

export function getRoutePlannerLegPlaceName(place: MotisPlanLeg['from'], fallbackLabel: string, routeOriginLabel: string, routeDestinationLabel: string) {
	const placeName = place.name;

	if (placeName === 'START') return routeOriginLabel;
	if (placeName === 'END') return routeDestinationLabel;

	return placeName || fallbackLabel;
}

function getIntermediateStops(leg: MotisPlanLeg) {
	return (leg.intermediateStops ?? []).filter(stop => getStopName(stop));
}

function getStopName(stop: MotisPlanIntermediateStop) {
	return stop.name || '';
}
