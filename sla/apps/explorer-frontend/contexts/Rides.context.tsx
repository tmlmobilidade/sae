'use client';

/* * */

import type { Ride, WebSocketMessage } from '@tmlmobilidade/core/types';

import { throttle } from 'lodash';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';

/* * */

interface RidesContextState {
	actions: {
		getRideById: (rideId: string) => Ride | undefined
	}
	data: {
		rides: Ride[]
		rides_map: Map<string, Ride>
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

	const allRidesRef = useRef(new Map<string, Ride>());
	const [allRidesRefVersion, setAllRidesRefVersion] = useState(0);

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
		//
	}, []);

	//
	// C. Transform data

	const allRidesData = useMemo(throttle(() => {
		console.log('ran allRidesData');
		return Array.from(allRidesRef.current.values());
	}, 1000), [allRidesRefVersion]);

	//
	// D. Handle actions

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
			allRidesRef.current.set(rideDocument._id, rideDocument);
			setAllRidesRefVersion(prev => prev++);
			return;
		}
		console.log('Unknown message:', messageData);
	};

	const getRideById = (rideId: string): Ride | undefined => {
		return allRidesRef.current?.get(rideId);
	};

	//
	// E. Define context value

	const contextValue: RidesContextState = {
		actions: {
			getRideById,
		},
		data: {
			rides: allRidesData || [],
			rides_map: allRidesRef.current,
		},
		flags: {
			is_loading: false,
		},
	};

	//
	// D. Render components

	return (
		<RidesContext.Provider value={contextValue}>
			{children}
		</RidesContext.Provider>
	);

	//
};
