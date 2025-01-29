'use client';

import { Ride, type WebSocketMessage } from '@tmlmobilidade/core/types';
import { throttle } from 'lodash';
import { useEffect, useRef, useState } from 'react';

import styles from './page.module.css';

export default function Home() {
	const dataRef = useRef(new Map<string, Ride>());
	const [, forceRender] = useState(0);
	const socketRef = useRef<null | WebSocket>(null);

	// Throttled function for re-rendering
	const throttledRender = useRef(throttle(() => forceRender(n => n + 1), 100)).current;

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
		const handleMessage = (event: MessageEvent) => {
			const messageData: WebSocketMessage = JSON.parse(event.data);

			if (messageData.action === 'init' && messageData.status === 'response' && messageData.data) {
				const rideDocuments: Ride[] = JSON.parse(messageData.data);
				rideDocuments.forEach((ride) => {
					dataRef.current.set(ride._id, ride);
				});
				throttledRender();
				return;
			}

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
		return () => {
			socket.removeEventListener('message', handleMessage);
			socket.close();
			throttledRender.cancel(); // Clean up throttling
		};
	}, [throttledRender]);

	return (
		<div className={styles.page}>
			Total Rides: {dataRef.current.size}
		</div>
	);
}
