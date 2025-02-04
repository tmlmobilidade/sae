/* * */

import styles from './styles.module.css';

/* * */

interface Props {
	caps?: boolean
	children: React.ReactNode
	size: 'lg' | 'md' | 'sm'
}

/* * */

export function Label({ caps, children, size }: Props) {
	//

	return (
		<p className={styles.text} data-caps={caps} data-size={size}>
			{children}
		</p>
	);

	//
}
