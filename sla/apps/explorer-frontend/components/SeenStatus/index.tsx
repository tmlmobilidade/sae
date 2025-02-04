/* * */

import { type RideDisplay } from '@/types/ride-display.type';

import styles from './styles.module.css';

/* * */

interface Props {
	value?: RideDisplay['seen_status']
}

/* * */

export function SeenStatus({ value }: Props) {
	return (
		<div className={styles.container} data-status={value}>
			<div className={styles.indicator} />
		</div>
	);
}
