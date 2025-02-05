'use client';

/* * */

import { type RideDisplay } from '@/types/ride-display.type';
import { getSeenStatus } from '@/utils/get-seen-status';
import { type Ride, type WebSocketMessage } from '@tmlmobilidade/core/types';
import { getOperationalDate } from '@tmlmobilidade/core/utils';
import { throttle } from 'lodash';
import { DateTime } from 'luxon';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';

/* * */

interface RidesContextState {
	actions: {
		getRideById: (rideId: string) => Ride | undefined
	}
	data: {
		rides_display: RideDisplay[]
		rides_store: Map<string, Ride>
	}
	flags: {
		is_loading: boolean
	}
}

/* * */

const RidesContext = createContext<RidesContextState | undefined>(undefined);

export function useRidesContext() {
	const context = useContext(RidesContext);
	if (!context) {
		throw new Error('useRidesContext must be used within a RidesContextProvider');
	}
	return context;
}

/* * */

export const RidesContextProvider = ({ children }: PropsWithChildren) => {
	//

	//
	// A. Setup variables

	const webSocketRef = useRef<null | WebSocket>(null);

	const [dataRidesDisplayState, setDataRidesDisplayState] = useState<RideDisplay[]>([]);
	const dataRidesStoreState = useRef<Map<string, Ride>>(new Map());

	const currentOperationalDate = getOperationalDate();

	//
	// B. Fetch data

	useEffect(() => {
		//
		// Initialize WebSocket connection
		if (!webSocketRef.current) {
			webSocketRef.current = new WebSocket('ws://localhost:5050');
		}
		// Request initial data
		webSocketRef.current.addEventListener('open', () => {
			handleSendMessage({
				action: 'init',
				module: 'sla-explorer',
				status: 'request',
			});
		});
		// Handle incoming messages
		webSocketRef.current.addEventListener('message', handleIncomingMessage);

		return () => {
			if (!webSocketRef.current) return;
			webSocketRef.current.removeEventListener('message', handleIncomingMessage);
			webSocketRef.current.close();
		};
		//
	}, []);

	//
	// C. Handle actions

	const handleSendMessage = (message: WebSocketMessage) => {
		if (!webSocketRef.current) return;
		webSocketRef.current.send(JSON.stringify(message));
	};

	const handleIncomingMessage = async (event: MessageEvent) => {
		// Parse incoming message
		const messageData: WebSocketMessage = JSON.parse(event.data);
		// Handle new change message
		if (messageData.action === 'change' && messageData.status === 'response' && messageData.data) {
			const rideDocument: Ride = JSON.parse(messageData.data);
			if (rideDocument.operational_date !== currentOperationalDate) return;
			dataRidesStoreState.current.set(rideDocument._id, rideDocument);
			updateRidesDisplayState();
			return;
		}
		console.log('Unknown message:', messageData);
	};

	const updateRidesDisplayState = throttle(() => {
		console.log('Starting allRidesData...', DateTime.now().toMillis(), dataRidesStoreState.current.size);
		const allRidesDisplay: Ride[] = Array.from(dataRidesStoreState.current.values());
		const allRidesParsed: RideDisplay[] = allRidesDisplay
			.sort((a, b) => {
				return String(a.start_time_scheduled).localeCompare(String(b.start_time_scheduled));
			})
			// .filter(item => item.operational_status === 'missed')
			.map(item => ({
				_ride: item,
				seen_status: getSeenStatus(item.seen_last_at),
			}));
		setDataRidesDisplayState(allRidesParsed);
		console.log('Finished allRidesData...', DateTime.now().toMillis(), dataRidesStoreState.current.size);
		console.log('----------------------------------------');
	}, 1000);

	const getRideById = (rideId: string): Ride | undefined => {
		return dataRidesStoreState.current?.get(rideId);
	};

	//
	// D. Define context value

	const contextValue: RidesContextState = useMemo(() => ({
		actions: {
			getRideById,
		},
		data: {
			rides_display: dataRidesDisplayState || [],
			rides_store: dataRidesStoreState.current,
		},
		flags: {
			is_loading: false,
		},
	}), [dataRidesDisplayState]);

	//
	// E. Render components

	return (
		<RidesContext.Provider value={contextValue}>
			{children}
		</RidesContext.Provider>
	);

	//
};
