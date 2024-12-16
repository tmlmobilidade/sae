/* * */

import styles from './styles.module.css';

/* * */

interface Props {
	cells: React.ReactNode[]
	layout: 'primaryWithFourDetails' | 'twoDetailsWithPrimary'
}

/* * */

export function Grid({ cells, layout }: Props) {
	//

	return (
		<div className={`${styles.container} ${styles[layout]}`}>
			{cells.map((cell, index) => (
				<div key={index} className={styles.cell}>
					{cell}
				</div>
			))}
		</div>
	);

	//
}
