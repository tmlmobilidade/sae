'use client';

import { LineBadge } from '@/components/lines/common/LineBadge';
import { useMotisLegDisplayLabel } from '@/hooks/route-planner/useMotisLegDisplayLabel';
import { type MotisPlanLeg } from '@/types/route-planner/models';
import { getMotisLegModeKind, getMotisLegRouteLabel, isMotisWalkingLeg } from '@/utils/route-planner/presentation/modes';
import { type HubLine } from '@tmlmobilidade/go-types-hub';

import styles from './styles.module.css';

/* * */

interface RoutePlannerLinePillProps {
	leg: MotisPlanLeg
	lineByShortName: Map<string, HubLine>
	size?: 'md' | 'sm'
}

/* * */

export function RoutePlannerLinePill({ leg, lineByShortName, size = 'sm' }: RoutePlannerLinePillProps) {
	//

	//
	// A. Setup variables

	const getLegDisplayLabel = useMotisLegDisplayLabel();

	//
	// B. Transform data

	const routeLabel = getMotisLegRouteLabel(leg);
	const label = getLegDisplayLabel(leg);
	const modeKind = getMotisLegModeKind(leg);
	const lineData = lineByShortName.get(routeLabel);

	//
	// C. Render components

	if (!isMotisWalkingLeg(leg) && lineData) {
		return <LineBadge lineData={lineData} size={size} />;
	}

	return (
		<span className={styles.linePill} data-mode={modeKind} data-size={size}>
			{label}
		</span>
	);

	//
}
