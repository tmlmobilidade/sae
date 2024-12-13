'use client';

import { AlertDetailContextProvider } from '@/components/context/AlertDetail.context';
import { useAlertsListContext } from '@/components/context/AlertList.context';
import React from 'react';

import AlertHeader from '../AlertHeader';
import AlertCauseEffect from '../form/AlertCauseEffect';
import AlertInfo from '../form/AlertInfo';
import AlertReferences from '../form/AlertReferences';
import AlertActiveSchedule from '../form/AlertScheduleActive';
import AlertPublicationSchedule from '../form/AlertSchedulePublication';
import styles from './styles.module.css';

export default function AlertDetail() {
	const alertListContext = useAlertsListContext();

	if (!alertListContext.data.selected) {
		return <div className={styles.noAlert}>Escolha um alerta</div>;
	}

	return (
		<AlertDetailContextProvider alert={alertListContext.data.selected}>
			<div className={styles.container}>
				<AlertHeader />
				<AlertInfo />
				<AlertPublicationSchedule />
				<AlertActiveSchedule />
				<AlertCauseEffect />
				<AlertReferences />
			</div>
		</AlertDetailContextProvider>
	);
}
