'use client';

import { Stop } from '@tmlmobilidade/services/types';

/* * */

import { createContext, useContext, useMemo, useState } from 'react';

/* * */

interface StopsListContextState {
	data: {
		raw: Stop[]
	}
	flags: {
		is_loading: boolean
	}
}

/* * */

const StopsListContext = createContext<StopsListContextState | undefined>(undefined);

export function useStopsListContext() {
	const context = useContext(StopsListContext);
	if (!context) {
		throw new Error('useStopsListContext must be used within a StopsListContextProvider');
	}
	return context;
}

/* * */

export const StopsListContextProvider = ({ children, stopsData }: { children: React.ReactNode, stopsData: Stop[] }) => {
	//
	// A. Setup variables
	const [isLoading] = useState(false);
	//
	// B. Fetch data
	const allStopsData = useMemo(() => stopsData, [stopsData]);

	//
	// E. Define context value

	const contextValue: StopsListContextState = {
		data: {
			raw: allStopsData,
		},
		flags: {
			is_loading: isLoading,
		},
	};

	//
	// F. Render components

	return (
		<StopsListContext.Provider value={contextValue}>
			{children}
		</StopsListContext.Provider>
	);

	//
};
