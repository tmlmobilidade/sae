/* * */

import { CardTemplate } from '@/components/cards/CardTemplate';
import { BigNumberString } from '@/components/text/BigNumberString';
import { ComparisonAbsolute } from '@/components/text/ComparisonAbsolute';

import styles from './styles.module.css';

/* * */

interface Props {
	bigNumber?: string
	comparison?: string
	endDate?: string
	isLoading?: boolean
	isValidating?: boolean
	level?: number
	startDate?: string
	timestamp?: number
	title?: string
}

/* * */

export function CardSummaryFixed({ bigNumber, comparison, endDate = '', isLoading = false, isValidating = false, level = 1, startDate = '', timestamp, title = '' }: Props) {
	return (
		<CardTemplate endDate={endDate} isLoading={isLoading} isValidating={isValidating} startDate={startDate} timestamp={timestamp} title={title}>
			<div className={styles.leftSection}>
				<BigNumberString level={level} value={bigNumber} />
				<ComparisonAbsolute level={level} value={comparison} />
			</div>
		</CardTemplate>
	);
}
