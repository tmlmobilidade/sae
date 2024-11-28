'use client';

import { AlertDetailContextProvider } from '@/components/context/AlertDetail.context';
import { useAlertsListContext } from '@/components/context/AlertList.context';
import React from 'react';

import AlertInfo from '../AlertInfo';
import AlertSchedule from '../AlertSchedule';
import styles from './styles.module.css';

export default function AlertDetail() {
	const selectedAlert = useAlertsListContext().data.selected;

	if (!selectedAlert) {
		return null;
	}

	return (
		<AlertDetailContextProvider alert={selectedAlert}>
			<div className={styles.container}>
				<AlertInfo />
				<AlertSchedule />
				<AlertSchedule />
				<AlertSchedule />
			</div>
		</AlertDetailContextProvider>
	);
}
