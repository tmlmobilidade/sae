'use client';

import { Surface } from '@/components/layout/Surface';
import { useAlertsListStore } from '@/store/alerts-list.store';
import { Alert } from '@tmlmobilidade/services/types';
import { useQueryState } from 'nuqs';
import { useEffect } from 'react';

import AlertListCard from '../AlertListCard';
import AlertSearch from '../AlertSearch';
import styles from './styles.module.css';

/* * */
export default function AlertList() {
	const alertsData = useAlertsListStore(state => state.data.filtered);
	const selectedAlertId = useAlertsListStore(state => state.data.selected?._id);
	const setSelectedAlertId = useAlertsListStore(state => state.actions.setSelectedAlertId);

	const [alertId, setAlertId] = useQueryState('alertId');

	useEffect(() => {
		if (alertId) {
			setSelectedAlertId(alertId);
		}
	}, [alertId, alertsData]);

	const handleSelect = (alert: Alert) => {
		if (!alert._id) return;
		setAlertId(alert._id.toString());
		setSelectedAlertId(alert._id.toString());
	};

	return (
		<Surface className={styles.container}>
			<div className={styles.header}>
				<AlertSearch />
			</div>
			<div className={styles.alertsContainer}>
				{alertsData.map(alert => (
					<AlertListCard alert={alert} key={alert._id?.toString()} onSelect={handleSelect} selected={alert._id?.toString() === selectedAlertId} />
				))}
			</div>
		</Surface>
	);
}
