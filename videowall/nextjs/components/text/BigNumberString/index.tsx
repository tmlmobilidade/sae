/* * */

import styles from './styles.module.css';

/* * */

export function BigNumberString({ direction = 'row', label = '', level = 1, type = 'normal', value = '-' }) {
	//

	//
	// B. Render components

	return (
		<div className={`${styles.container} ${styles[`level_${level}`]} ${styles[`type_${type}`]} ${styles[`direction_${direction}`]}`}>
			<p className={styles.value}>{value}</p>
			<p className={styles.label}>{label}</p>
		</div>
	);

	//
}
