import { useAlertsListStore } from '@/store/alerts-list.store';

import AlertHeader from '../AlertHeader';
import AlertImage from '../AlertImage';
import AlertInfo from '../AlertInfo';
import AlertSchedule from '../AlertSchedule';
import styles from './styles.module.css';

/* * */

export default function AlertDetail() {
	return (
		<div className={styles.container}>
			<AlertHeader />
			<AlertInfo />
			<AlertImage />
			<AlertSchedule />
		</div>
	);
}
