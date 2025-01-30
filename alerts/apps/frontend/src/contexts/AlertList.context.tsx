"use client"

import { swrFetcher } from "@/lib/http";
import { Routes } from "@/lib/routes";
import { Alert } from "@tmlmobilidade/core-types";
import { createContext, useContext, useMemo } from "react";
import useSWR from "swr";

interface AlertListContextState {
    data: {
        raw: Alert[];
        filtered: Alert[];
    }
    flags: {
        isLoading: boolean;
        error: Error | undefined;
    }
    actions: {
        filterAlerts: (filter: string) => void;
    }
}

const AlertListContext = createContext<AlertListContextState | undefined>(undefined);

export const useAlertListContext = () => {
    const context = useContext(AlertListContext);
    if (!context) {
        throw new Error("useAlertListContext must be used within an AlertListContextProvider");
    }
    return context;
}

export const AlertListContextProvider = ({ children }: { children: React.ReactNode }) => {
	//

	//
	// A. Fetch data
	const { data: allAlertsData, isLoading: allAlertsLoading, error: allAlertsError } = useSWR<Alert[], Error>(`${Routes.ALERTS_API}/alerts`, swrFetcher);
    
    const rawAlerts = useMemo(() => allAlertsData || [], [allAlertsData]);


	//
	// C. Define context value

	const contextValue: AlertListContextState = useMemo(() => ({
		data: {
			raw: rawAlerts || [],
			filtered: rawAlerts || [],
		},
		actions: {
			filterAlerts: (filter: string) => {
				// TODO: Implement filter
			}
		},
		flags: {
			isLoading: allAlertsLoading,
			error: allAlertsError,
		},
	}), [
        rawAlerts,
        allAlertsData,
        allAlertsLoading,
        allAlertsError,
    ]);
    
	//
	// D. Render components

	return (
		<AlertListContext.Provider value={contextValue}>
			{children}
		</AlertListContext.Provider>
	);

	//
};