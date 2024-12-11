/* * */

import { ScreenHeader } from '@/components/layout/ScreenHeader';

import styles from './styles.module.css';

/* * */

export function ScreenWrapper({ children }) {
	return (
		<div className={styles.container}>
			<ScreenHeader />
			<div className={styles.content}>{children}</div>
		</div>
	);
}
