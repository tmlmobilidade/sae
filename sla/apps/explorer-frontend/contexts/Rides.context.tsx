'use client';

/* * */

import { getDelayStatus } from '@/utils/get-delay-status';
import { getOperationalStatus } from '@/utils/get-operational-status';
import { getSeenStatus } from '@/utils/get-seen-status';
import { getStartTime } from '@/utils/get-start-time';
import { type Ride, RideAnalysis, type RideDisplay, type WebSocketMessage } from '@tmlmobilidade/core/types';
import { getOperationalDate } from '@tmlmobilidade/core/utils';
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';

/* * */

export interface ExtendedRideDisplay extends RideDisplay {
	delay_status: 'delayed' | 'early' | 'ontime' | null
	simple_three_vehicle_events_grade: RideAnalysis['grade']
	start_time_observed_display: null | string
	start_time_scheduled_display: string
}

interface RidesContextState {
	actions: {
		getRideById: (rideId: string) => Ride | undefined
	}
	data: {
		rides_display: ExtendedRideDisplay[]
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

	const dataRidesStoreState = useRef<Map<string, Ride>>(new Map());
	const [dataRidesDisplayState, setDataRidesDisplayState] = useState<ExtendedRideDisplay[]>([]);

	const flagIsLoadingRef = useRef<boolean>(true);

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
			return;
		}
		// Handle complete message
		if (messageData.action === 'init' && messageData.status === 'complete') {
			console.log('complete');
			flagIsLoadingRef.current = false;
			return;
		}
		console.log('Unknown message:', messageData);
	};

	useEffect(() => {
		const refreshList = () => {
			const allRidesDisplay: ExtendedRideDisplay[] = Array
				.from(dataRidesStoreState.current.values())
				.sort((a, b) => String(a.start_time_scheduled).localeCompare(String(b.start_time_scheduled)))
				.map((item) => {
					return {
						...item,
						delay_status: getDelayStatus(item.start_time_scheduled, item.start_time_observed),
						operational_status: getOperationalStatus(item.start_time_scheduled, item.seen_last_at),
						seen_status: getSeenStatus(item.seen_last_at),
						simple_three_vehicle_events_grade: item.analysis.find(analysis => analysis._id === 'SIMPLE_THREE_VEHICLE_EVENTS')?.grade || null,
						start_time_observed_display: item.start_time_observed ? getStartTime(item.start_time_observed) : null,
						start_time_scheduled_display: getStartTime(item.start_time_scheduled),
					};
				});
			setDataRidesDisplayState(allRidesDisplay);
		};
		const interval = setInterval(refreshList, 1000);
		return () => clearInterval(interval);
	}, [dataRidesStoreState.current]);

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
			rides_display: dataRidesDisplayState,
			rides_store: dataRidesStoreState.current,
		},
		flags: {
			is_loading: flagIsLoadingRef.current,
		},
	}), [dataRidesDisplayState, dataRidesStoreState.current, flagIsLoadingRef.current]);

	//
	// E. Render components

	return (
		<RidesContext.Provider value={contextValue}>
			{children}
		</RidesContext.Provider>
	);

	//
};
