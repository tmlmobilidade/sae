'use client';

/* * */

import type { Ride, WebSocketMessage } from '@tmlmobilidade/core/types';

import { DateTime } from 'luxon';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef } from 'react';
import useSWR from 'swr';

/* * */

interface RidesContextState {
	actions: {
		getRideById: (rideId: string) => Ride | undefined
	}
	data: {
		rides: Ride[]
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

	const allRidesRef = useRef(new Map<string, Ride>());
	const webSocketRef = useRef<null | WebSocket>(null);

	//
	// B. Fetch data

	useEffect(() => {
		// Initialize WebSocket connection
		webSocketRef.current = new WebSocket('ws://localhost:5050');
		// Handle connection open
		webSocketRef.current.addEventListener('open', () => {
			const message: WebSocketMessage = {
				action: 'init',
				module: 'sla-explorer',
				status: 'request',
			};
			webSocketRef.current.send(JSON.stringify(message));
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

	//
	// B. Handle actions

	const getRideById = (rideId: string): Ride | undefined => {
		return allRidesData?.find(ride => ride.id === rideId);
	};

	const getRideByIdGeoJsonFC = (rideId: string): GeoJSON.FeatureCollection | undefined => {
		const ride = getRideById(rideId);
		if (!ride) return;
		const collection = getBaseGeoJsonFeatureCollection();
		collection.features.push(transformRideDataIntoGeoJsonFeature(ride));
		return collection;
	};

	const getRidesByLineId = (lineId: string): Ride[] => {
		return allRidesData?.filter(ride => ride.line_id === lineId) || [];
	};

	const getRidesByLineIdGeoJsonFC = (lineId: string): GeoJSON.FeatureCollection | undefined => {
		const rides = getRidesByLineId(lineId);
		if (!rides) return;
		const collection = getBaseGeoJsonFeatureCollection();
		rides.forEach(ride => collection.features.push(transformRideDataIntoGeoJsonFeature(ride)));
		return collection;
	};

	const getRidesByPatternId = (patternId: string): Ride[] => {
		return allRidesData?.filter(ride => ride.pattern_id === patternId) || [];
	};

	const getRidesByPatternIdGeoJsonFC = (patternId: string): GeoJSON.FeatureCollection | undefined => {
		const rides = getRidesByPatternId(patternId);
		if (!rides) return;
		const collection = getBaseGeoJsonFeatureCollection();
		rides.forEach(ride => collection.features.push(transformRideDataIntoGeoJsonFeature(ride)));
		return collection;
	};

	const getRidesByTripId = (tripId: string): Ride[] => {
		return allRidesData?.filter(ride => ride.trip_id === tripId) || [];
	};

	const getRidesByTripIdGeoJsonFC = (tripId: string): GeoJSON.FeatureCollection | undefined => {
		const rides = getRidesByTripId(tripId);
		if (!rides) return;
		const collection = getBaseGeoJsonFeatureCollection();
		rides.forEach(ride => collection.features.push(transformRideDataIntoGeoJsonFeature(ride)));
		return collection;
	};

	//
	// C. Define context value

	const contextValue: RidesContextState = {
		actions: {
			getRideById,
			getRideByIdGeoJsonFC,
			getRidesByLineId,
			getRidesByLineIdGeoJsonFC,
			getRidesByPatternId,
			getRidesByPatternIdGeoJsonFC,
			getRidesByTripId,
			getRidesByTripIdGeoJsonFC,
		},
		data: {
			rides: allRidesData || [],
		},
		flags: {
			is_loading: allRidesLoading,
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

/* * */

function transformRideDataIntoGeoJsonFeature(rideData: Ride): GeoJSON.Feature<GeoJSON.Point> {
	return {
		geometry: {
			coordinates: [rideData.lon, rideData.lat],
			type: 'Point',
		},
		properties: {
			bearing: rideData.bearing,
			block_id: rideData.block_id,
			current_status: rideData.current_status,
			delay: Math.floor(Date.now() / 1000) - rideData.timestamp,
			id: rideData.id,
			line_id: rideData.line_id,
			pattern_id: rideData.id,
			route_id: rideData.route_id,
			schedule_relationship: rideData.schedule_relationship,
			shift_id: rideData.shift_id,
			speed: rideData.speed,
			stop_id: rideData.stop_id,
			timestamp: rideData.timestamp,
			timeString: new Date(rideData.timestamp * 1000).toLocaleString(),
			trip_id: rideData.trip_id,
		},
		type: 'Feature',
	};
}
