'use client';

import { Surface } from '@/components/layout/Surface';
import { useAlertsListStore } from '@/store/alerts-list.store';

import AlertListCard from '../AlertListCard';
import AlertSearch from '../AlertSearch';
import styles from './styles.module.css';

/* * */
export default function AlertList() {
	const alertsData = useAlertsListStore(state => state.data.filtered);
	const selectedAlertId = useAlertsListStore(state => state.data.selected?._id);
	return (
		<Surface className={styles.container}>
			<div className={styles.header}>
				<AlertSearch />
			</div>
			<div className={styles.alertsContainer}>
				{alertsData.map(alert => (
					<AlertListCard alert={alert} key={alert._id?.toString()} selected={alert._id === selectedAlertId} />
				))}
			</div>
		</Surface>
	);
}
