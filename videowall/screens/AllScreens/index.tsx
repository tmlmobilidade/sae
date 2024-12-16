'use client';

/* * */

import { Screen1 } from '@/screens/Screen1';
import { Screen2 } from '@/screens/Screen2';
import { Screen3 } from '@/screens/Screen3';
import { Screen4 } from '@/screens/Screen4';
import Snowfall from 'react-snowfall';

import styles from './styles.module.css';

/* * */

export function AllScreens() {
	return (
		<div className={styles.container}>
			<Screen1 />
			<Screen2 />
			<Screen3 />
			<Screen4 />
			<Snowfall speed={[0.5, 1]} wind={[-1, 0]} />
		</div>
	);
}
