'use client';

/* * */

import { useRidesListContext } from '@/contexts/RidesList.context';
import { IconPlayerPlayFilled } from '@tabler/icons-react';
import { DateTime } from 'luxon';
import { useEffect, useRef, useState } from 'react';

import styles from './styles.module.css';

/* * */

export function RidesListClock() {
	//

	//
	// A. Setup variables

	const ridesListContext = useRidesListContext();

	const elementRef = useRef(null);

	const [currentTimeHours, setCurrentTimeHours] = useState<string>('');
	const [currentTimeMinutes, setCurrentTimeMinutes] = useState<string>('');
	const [currentTimeSeconds, setCurrentTimeSeconds] = useState<string>('');
	const [currentTimeDivider, setCurrentTimeDivider] = useState<boolean>(true);

	//
	// B. Transform data

	const updateCurrentTime = () => {
		const currentTime = DateTime.now();
		setCurrentTimeHours(currentTime.toFormat('HH'));
		setCurrentTimeMinutes(currentTime.toFormat('mm'));
		setCurrentTimeSeconds(currentTime.toFormat('ss'));
		setCurrentTimeDivider(prev => !prev);
	};

	useEffect(() => {
		updateCurrentTime();
		const interval = setInterval(updateCurrentTime, 1000);
		return () => clearInterval(interval);
	}, []);

	//
	// C. Handle actions

	const handleToggleLock = () => {
		if (elementRef.current) {
			// Set the current position of the clock relative to the viewport
			const rect = elementRef.current.getBoundingClientRect();
			ridesListContext.actions.setLockStatus(-rect.top);
		}
	};

	//
	// D. Render components

	return (
		<div ref={elementRef} className={styles.root} data-locked={ridesListContext.data.is_locked}>
			<div className={styles.handle} onClick={handleToggleLock}>
				<IconPlayerPlayFilled className={styles.icon} size={10} />
				<span className={styles.time}>
					<span className={styles.hours}>{currentTimeHours}</span>
					<span className={styles.divider} data-blink={currentTimeDivider}>:</span>
					<span className={styles.minutes}>{currentTimeMinutes}</span>
					<span className={styles.seconds}>:{currentTimeSeconds}</span>
				</span>
			</div>
		</div>
	);

	//
}
