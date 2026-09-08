'use client';

import { useLinesData } from '@/components/lines/use-lines-data';
import { IconInfoTriangleFilled } from '@tabler/icons-react';
import { type HubLine } from '@tmlmobilidade/go-types-hub';

import styles from './styles.module.css';

/* * */

interface LineBadgeProps {
	agencyId?: string
	color?: string
	lineData?: HubLine
	lineId?: string
	onClick?: () => void
	shortName?: string
	size?: 'lg' | 'md' | 'sm'
	textColor?: string
	withAlertIcon?: boolean
}

/* * */

export function LineBadge({ agencyId, color, lineData, lineId, onClick, shortName, size = 'md', textColor, withAlertIcon = false }: LineBadgeProps) {
	//

	//
	// A. Setup variables

	const { data: lines } = useLinesData();

	//
	// B. Transform data

	const fetchedLineData = lineId ? lines.find(line => line._id === lineId) : undefined;

	//
	// C. Render components

	return (
		<div
			className={styles.badge}
			data-agency-id={agencyId || lineData?.agency_id || fetchedLineData?.agency_id}
			data-clickable={!!onClick}
			data-size={size}
			onClick={onClick}
			style={{ backgroundColor: color || lineData?.color || fetchedLineData?.color, color: textColor || lineData?.text_color || fetchedLineData?.text_color }}
		>
			{shortName || lineData?.short_name || fetchedLineData?.short_name || '• • •'}
			{withAlertIcon && (
				<div className={styles.alertIcon}>
					<IconInfoTriangleFilled size={12} />
				</div>
			)}
		</div>
	);
}
