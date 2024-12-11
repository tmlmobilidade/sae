/* * */

import styles from './styles.module.css';

/* * */

export function ScreenWrapper({ children }) {
	return <div className={styles.container}>{children}</div>;
}
