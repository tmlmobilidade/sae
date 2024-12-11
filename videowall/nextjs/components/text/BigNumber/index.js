/* * */

import styles from './styles.module.css';

/* * */

export default function Component({ direction = 'row', label = '', level = 1, type = 'normal', value = -1 }) {
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
