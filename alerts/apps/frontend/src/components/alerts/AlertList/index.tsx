'use client';

import { useAlertsListContext } from '@/context/AlertList.context';
import { Surface } from '@/components/layout/Surface';

import AlertListCard from '../AlertListCard';
import AlertSearch from '../AlertSearch';
import styles from './styles.module.css';

/* * */
export default function AlertList() {
	const alertsContext = useAlertsListContext();

	return (
		<Surface className={styles.container}>
			<div className={styles.header}>
				<AlertSearch />
			</div>
			<div className={styles.alertsContainer}>
				{alertsContext.data.filtered.map(alert => (
					<AlertListCard alert={alert} key={alert._id?.toString()} selected={alert._id?.toString() === alertsContext.data.selected?._id} />
				))}
			</div>
		</Surface>
	);
}
