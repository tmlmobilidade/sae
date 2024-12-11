/* * */

import styles from './styles.module.css';

/* * */

interface Props {
	direction?: 'column' | 'row'
	label?: string
	level?: 1 | 2 | 3
	type?: 'highlight' | 'normal'
	value?: number
}

/* * */

export function BigNumber({ direction = 'row', label = '', level = 1, type = 'normal', value = -1 }: Props) {
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
