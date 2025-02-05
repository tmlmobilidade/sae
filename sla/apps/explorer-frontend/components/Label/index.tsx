/* * */

import styles from './styles.module.css';

/* * */

interface Props {
	caps?: boolean
	children: React.ReactNode
	lines?: number
	size: 'lg' | 'md' | 'sm'
}

/* * */

export function Label({ caps, children, lines, size }: Props) {
	return (
		<p className={styles.text} data-caps={caps} data-lines={lines} data-size={size}>
			{children}
		</p>
	);
}
