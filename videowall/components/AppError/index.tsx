'use client';

/* * */

import { IconTrafficCone } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

import styles from './styles.module.css';

/* * */

export function AppError() {
	//

	//
	// A. Setup variables

	const [reloadInSeconds, setReloadInSeconds] = useState(60);

	//
	// B. Transform data

	useEffect(() => {
		const interval = setInterval(() => {
			if (reloadInSeconds === 1) window.location.reload();
			else setReloadInSeconds(prev => prev - 1);
		}, 1000);
		return () => clearInterval(interval);
	}, [reloadInSeconds]);

	//
	// C. Handle actions

	const handleGoToHomepage = () => {
		window.location.replace('/');
	};

	//
	// D. Render Components

	return (
		<div className={styles.container}>
			<IconTrafficCone className={styles.icon} size={75} />
			<h1 className={styles.title}>title</h1>
			<h2 className={styles.subtitle}>subtitle</h2>
			<p className={styles.retryMessage}>retry, reloadInSeconds</p>
			<a onClick={handleGoToHomepage}>goto_home</a>
		</div>
	);

	//
}
