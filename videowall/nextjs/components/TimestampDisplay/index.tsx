/* * */

import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

import styles from './styles.module.css';

/* * */

interface Props {
	timestamp?: number
}

/* * */

export function TimestampDisplay({ timestamp = 0 }: Props) {
	//

	//
	// A. Setup variables

	const [timestampLabel, setTimestampLabel] = useState('Atualizado agora');

	//
	// B. Transform data

	useEffect(() => {
		if (!timestamp) return;
		const updateTimestamp = () => {
			const now = DateTime.now();
			const date = DateTime.fromMillis(timestamp);
			const diff = now.diff(date, ['minutes', 'seconds', 'milliseconds']);
			const diffObj = diff.toObject();
			if (diffObj.minutes === 0 && diffObj.seconds && diffObj.seconds > 0) {
				const diffStr = `Atualizado há ${diffObj.seconds} segundos`;
				setTimestampLabel(diffStr);
				return;
			}
			if (diffObj.minutes === 1) {
				const diffStr = `Atualizado há 1 minuto e ${diffObj.seconds} segundos`;
				setTimestampLabel(diffStr);
				return;
			}
			const diffStr = `Atualizado há ${diffObj.minutes} minutos e ${diffObj.seconds} segundos`;
			setTimestampLabel(diffStr);
		};
		updateTimestamp();
		const interval = setInterval(updateTimestamp, 1000);
		return () => clearInterval(interval);
	}, [timestamp]);

	//
	// C. Render components

	if (!timestamp) return <></>;

	return <p className={styles.container}>{timestampLabel}</p>;

	//
}
