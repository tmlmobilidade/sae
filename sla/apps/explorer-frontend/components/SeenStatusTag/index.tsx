/* * */

import { type RideDisplay } from '@tmlmobilidade/core/types';

import styles from './styles.module.css';

/* * */

interface Props {
	value?: RideDisplay['seen_status']
}

/* * */

export function SeenStatusTag({ value }: Props) {
	return (
		<div className={styles.container} data-status={value}>
			<div className={styles.indicator} />
		</div>
	);
}
