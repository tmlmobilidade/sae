/* * */

import styles from './styles.module.css';

/* * */

interface Props {
	direction?: 'column' | 'row'
	level?: 1 | 2 | 3
	type?: 'highlight' | 'normal'
	value?: number | string
}

/* * */

export function Comparison({ direction = 'row', level = 1, type = 'normal', value = -1 }: Props) {
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
