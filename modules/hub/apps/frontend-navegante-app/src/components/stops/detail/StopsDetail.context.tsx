'use client';

import { useStopDetailData } from '@/components/stops/detail/use-stop-detail-data';
import { type HubAlert, type HubLine, type HubStop } from '@tmlmobilidade/go-types-hub';
import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';

/* * */

interface StopsDetailContextState {
	data: {
		active_alerts: HubAlert[]
		associated_lines: HubLine[]
		stop: HubStop | undefined
		timetable: ReturnType<typeof useStopDetailData>['timetable']
	}
	flags: {
		is_loading: boolean
	}
}

/* * */

const StopsDetailContext = createContext<StopsDetailContextState | undefined>(undefined);

export function useStopsDetailContext() {
	const context = useContext(StopsDetailContext);
	if (!context) {
		throw new Error('useStopsDetailContext must be used within a StopsDetailContextProvider');
	}
	return context;
}

/* * */

export function StopsDetailContextProvider({ children, stopId }: PropsWithChildren<{ stopId: string }>) {
	//

	//
	// A. Fetch data

	const { activeAlerts, associatedLines, isLoading, stop, timetable } = useStopDetailData(stopId);

	//
	// B. Define context value

	const contextValue = useMemo<StopsDetailContextState>(() => ({
		data: {
			active_alerts: activeAlerts,
			associated_lines: associatedLines,
			stop,
			timetable,
		},
		flags: {
			is_loading: isLoading,
		},
	}), [activeAlerts, associatedLines, isLoading, stop, timetable]);

	//
	// C. Render components

	return (
		<StopsDetailContext.Provider value={contextValue}>
			{children}
		</StopsDetailContext.Provider>
	);

	//
}
