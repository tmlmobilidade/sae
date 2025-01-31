/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Ride, type WebSocketMessage } from '@tmlmobilidade/core/types';
import { throttle } from 'lodash';
import { DateTime } from 'luxon';
import { useEffect, useRef, useState } from 'react';
import { ViewportList } from 'react-viewport-list';

import styles from './page.module.css';

export default function Home() {
	const dataRef = useRef(new Map<string, Ride>());
	const [ridesListData, setRidesListData] = useState<any[]>([]);
	const socketRef = useRef<null | WebSocket>(null);

	const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

	// Throttled function for re-rendering
	const throttledRender = useRef(throttle(() => {
		const ridesData = Array
			.from(dataRef.current.values())
			.sort((a, b) => DateTime.fromJSDate(a.start_time_scheduled).toMillis() - DateTime.fromJSDate(b.start_time_scheduled).toMillis())
			// .sort((a, b) => collator.compare(a.pattern_id, b.pattern_id))
			.map(ride => ({
				_id: ride._id,
				seen_last_at: ride.seen_last_at ? DateTime.fromJSDate(ride.seen_last_at).toFormat('yyyy-MM-dd HH:mm:ss') : 'null',
				start_time_scheduled: DateTime.fromJSDate(ride.start_time_scheduled).toFormat('yyyy-MM-dd HH:mm:ss'),
				validations_count: ride.validations_count,
			}));
		setRidesListData(ridesData);
	}, 1000)).current;

	useEffect(() => {
		// Initialize WebSocket connection
		const socket = new WebSocket('ws://localhost:5050');
		socketRef.current = socket;

		// Handle connection open
		socket.addEventListener('open', () => {
			const message: WebSocketMessage = {
				action: 'init',
				module: 'sla-explorer',
				status: 'request',
			};
			socket.send(JSON.stringify(message));
		});

		// Handle incoming messages
		const handleMessage = async (event: MessageEvent) => {
			const messageData: WebSocketMessage = JSON.parse(event.data);

			if (messageData.action === 'change' && messageData.status === 'response' && messageData.data) {
				const rideDocument: Ride = JSON.parse(messageData.data);
				dataRef.current.set(rideDocument._id, rideDocument);
				throttledRender();
				return;
			}

			console.log('Unknown message:', messageData);
		};

		socket.addEventListener('message', handleMessage);

		// Cleanup WebSocket on unmount
		// return () => {
		// 	socket.removeEventListener('message', handleMessage);
		// 	socket.close();
		// 	throttledRender.cancel(); // Clean up throttling
		// };
	}, [throttledRender]);

	return (
		<div className={styles.page}>

			Total Rides: {ridesListData.length || 0}

			<ViewportList itemMargin={0} items={ridesListData}>
				{item => (
					<div key={item._id}>
						<span>{item._id}</span>
						<span>{item.start_time_scheduled}</span>
					</div>
				)}
			</ViewportList>

		</div>
	);
}
