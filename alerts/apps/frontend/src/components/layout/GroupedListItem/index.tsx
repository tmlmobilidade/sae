/* * */

import styles from './styles.module.css';

/* * */

interface GroupedListItemProps {
	children: React.ReactNode
	label?: string
	title: string
}

/* * */

export function GroupedListItem({ children, label, title }: GroupedListItemProps) {
	return (
		<div className={styles.container}>
			<div className={styles.header}>
				{label && <h6 className={styles.label}>{label}</h6>}
				<h2 className={styles.title}>{title}</h2>
			</div>
			<div className={styles.childrenWrapper}>
				{children}
			</div>
		</div>
	);
}
