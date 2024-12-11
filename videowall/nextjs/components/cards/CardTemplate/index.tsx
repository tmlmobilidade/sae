/* * */

import { Loader } from '@/components/common/Loader';
import { LabelDateFromTo } from '@/components/text/LabelDateFromTo';
import { LabelDateRelative } from '@/components/text/LabelDateRelative';

import styles from './styles.module.css';

/* * */

interface Props {
	children: React.ReactNode
	endDate?: string
	isLoading?: boolean
	isValidating?: boolean
	startDate?: string
	timestamp?: number
	title?: string
}

/* * */

export function CardTemplate({ children, endDate = '', isLoading = false, isValidating = false, startDate = '', timestamp, title = '' }: Props) {
	//

	//
	// A. Setup variables

	//
	// B. Render components

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.title}>{title}</div>
				<div>{isLoading || isValidating ? <Loader size={18} visible /> : <LabelDateRelative timestamp={timestamp} />}</div>
			</div>
			{children}
			{(endDate || startDate) && <LabelDateFromTo endDate={endDate} startDate={startDate} />}
		</div>
	);

	//
}
