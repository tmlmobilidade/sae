/* * */

import { LineBadge } from '@/components/lines/common/LineBadge';
import { LineName } from '@/components/lines/common/LineName';
import { type HubLine } from '@tmlmobilidade/go-types-hub';
import { Skeleton } from '@tmlmobilidade/ui';

import styles from './styles.module.css';

/* * */

interface LineDisplayProps {
	agencyId?: string
	color?: string
	lineData?: HubLine
	longName?: string
	searchQuery?: string
	shortName?: string
	size?: 'lg' | 'md'
	textColor?: string
	width?: number
}

/* * */

export function LineDisplay({ agencyId, color, lineData, longName, searchQuery, shortName, size = 'md', textColor, width = 200 }: LineDisplayProps) {
	//

	if (lineData) {
		return (
			<div className={styles.container}>
				<LineBadge agencyId={lineData.agency_id} color={lineData.color} shortName={lineData.short_name} size={size} textColor={lineData.text_color} />
				<LineName longName={lineData.long_name} searchQuery={searchQuery} />
			</div>
		);
	}

	if (longName && shortName && color && textColor) {
		return (
			<div className={styles.container}>
				<LineBadge agencyId={agencyId} color={color} shortName={shortName} size={size} textColor={textColor} />
				<LineName longName={longName} searchQuery={searchQuery} />
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<Skeleton height={24} radius={9999} width={65} />
			<Skeleton height={24} width={width} />
		</div>
	);

	//
}
