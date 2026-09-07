'use client';

import { RoutePlannerLinePill } from '@/components/routes/common/RoutePlannerLinePill';
import { RoutePlannerModeBadge } from '@/components/routes/common/RoutePlannerModeBadge';
import { type MotisPlanLeg } from '@/types/route-planner/models';
import { getMotisLegDurationSeconds } from '@/utils/route-planner/planning/motis-plan-api';
import { formatMotisPlanDurationMinutes } from '@/utils/route-planner/presentation/format';
import { isMotisWalkingLeg } from '@/utils/route-planner/presentation/modes';
import { IconWalk } from '@tabler/icons-react';
import { type HubLine } from '@tmlmobilidade/go-types-hub';

import styles from './styles.module.css';

/* * */

interface RoutePlannerLegStripItemProps {
	leg: MotisPlanLeg
	lineByShortName: Map<string, HubLine>
	showConnector: boolean
}

/* * */

export function RoutePlannerLegStripItem({ leg, lineByShortName, showConnector }: RoutePlannerLegStripItemProps) {
	//

	//
	// A. Transform data

	const durationMinutes = formatMotisPlanDurationMinutes(getMotisLegDurationSeconds(leg));

	//
	// B. Render components

	return (
		<div className={styles.stripItem}>
			{isMotisWalkingLeg(leg) ? (
				<div className={styles.walkPill}>
					<IconWalk size={15} />
					{durationMinutes ? `${durationMinutes}'` : null}
				</div>
			) : (
				<>
					<RoutePlannerModeBadge leg={leg} size="sm" />
					<RoutePlannerLinePill leg={leg} lineByShortName={lineByShortName} />
				</>
			)}
			{showConnector && <span className={styles.connector}>•••</span>}
		</div>
	);

	//
}
