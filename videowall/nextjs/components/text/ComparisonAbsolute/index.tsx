/* * */

import styles from './styles.module.css';

/* * */

export function ComparisonAbsolute({ direction = 'row', level = 1, type = 'normal', value = '-' }) {
	//

	//
	// B. Render components

	return (
		<div className={`${styles.container} ${styles[`level_${level}`]} ${styles[`type_${type}`]} ${styles[`direction_${direction}`]}`}>
			<p className={styles.value}>{value}</p>
		</div>
	);

	//
}
