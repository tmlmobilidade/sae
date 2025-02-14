'use client';

/* * */

import { useRidesContext } from '@/contexts/Rides.context';
import { DateTime } from 'luxon';
import { createContext, type PropsWithChildren, type RefObject, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ViewportListRef } from 'react-viewport-list';

/* * */

interface RidesListContextState {
	actions: {
		setLockStatus: (value: number) => void
		updateLockIndex: () => void
	}
	data: {
		is_locked: boolean
		is_user_scrolling: boolean
		list_ref: RefObject<ViewportListRef>
		lock_index: number
		lock_offset: number
	}
}

/* * */

const RidesListContext = createContext<RidesListContextState | undefined>(undefined);

export function useRidesListContext() {
	const context = useContext(RidesListContext);
	if (!context) {
		throw new Error('useRidesListContext must be used within a RidesListContextProvider');
	}
	return context;
}

/* * */

export const RidesListContextProvider = ({ children }: PropsWithChildren) => {
	//

	//
	// A. Setup variables

	const ridesContext = useRidesContext();

	const dataListRef = useRef<null | ViewportListRef>(null);
	const [dataLockIndexState, setDataLockIndexState] = useState<number>(0);
	const [dataLockOffsetState, setDataLockOffsetState] = useState<number>(-150);
	const [dataIsLockedState, setDataIsLockedState] = useState<boolean>(true);
	const [dataIsUserScrollingState, setDataIsUserScrollingState] = useState<boolean>(false);

	const scrollTimeout = useRef(null);

	//
	// B. Handle actions

	useEffect(() => {
		const nowMillis = DateTime.now().toMillis();
		for (const [rideIndex, rideData] of ridesContext.data.rides_display.entries()) {
			const rideMillis = DateTime.fromJSDate(new Date(rideData.start_time_scheduled)).toMillis();
			if (nowMillis - rideMillis <= 0) {
				setDataLockIndexState(rideIndex);
				return;
			}
		}
	}, [ridesContext.data.rides_display]);

	useEffect(() => {
		const interval = setInterval(() => {
			// Check if the clock is locked and the user is not scrolling
			if (dataListRef.current && dataIsLockedState && !dataIsUserScrollingState) {
				dataListRef.current.scrollToIndex({
					index: dataLockIndexState,
					offset: dataLockOffsetState,
				});
			}
		}, 10);
		return () => clearInterval(interval);
	}, [dataIsLockedState, dataIsUserScrollingState, dataLockIndexState, dataLockOffsetState]);

	useEffect(() => {
		if (typeof window === 'undefined' || !dataIsLockedState) return;
		const handleUserScroll = () => {
			// Set the flag if the user is scrolling
			setDataIsUserScrollingState(true);
			// Clear the timeout if the user is still scrolling
			if (scrollTimeout.current)clearTimeout(scrollTimeout.current);
			// Set a timeout to clear the flag if the user stops scrolling
			scrollTimeout.current = setTimeout(() => setDataIsUserScrollingState(false), 200);
		};
		window.addEventListener('wheel', handleUserScroll, { passive: true });
		window.addEventListener('touchmove', handleUserScroll, { passive: true });
		return () => {
			window.removeEventListener('wheel', handleUserScroll);
			window.removeEventListener('touchmove', handleUserScroll);
		};
	}, [dataIsLockedState]);

	useEffect(() => {
		if (typeof window === 'undefined' || !dataIsLockedState) return;
		// Save the initial scroll position
		const initialScrollY = window.scrollY;
		const handleScroll = () => {
			// Check if the scroll was triggered by the user
			if (!dataIsUserScrollingState) return;
			// Check if the user scrolled more than 150px
			const scrolledDistance = Math.abs(window.scrollY - initialScrollY);
			if (scrolledDistance > 150) {
				setDataIsLockedState(false);
			}
		};
		window.addEventListener('scroll', handleScroll);
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, [dataIsLockedState, dataIsUserScrollingState]);

	const setLockStatus = (offset: number) => {
		setDataLockOffsetState(offset);
		setDataIsLockedState(prev => !prev);
	};

	const updateLockIndex = () => {
		setDataLockIndexState(prev => prev + 1);
	};

	//
	// C. Define context value

	const contextValue: RidesListContextState = useMemo(() => ({
		actions: {
			setLockStatus,
			updateLockIndex,
		},
		data: {
			is_locked: dataIsLockedState,
			is_user_scrolling: dataIsUserScrollingState,
			list_ref: dataListRef,
			lock_index: dataLockIndexState,
			lock_offset: dataLockOffsetState,
		},
	}), [dataListRef.current, dataLockIndexState, dataLockOffsetState, dataIsLockedState, dataIsUserScrollingState]);

	//
	// D. Render components

	return (
		<RidesListContext.Provider value={contextValue}>
			{children}
		</RidesListContext.Provider>
	);

	//
};
