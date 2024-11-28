'use client';

import { useForm, UseFormReturnType, zodResolver } from '@mantine/form';
import { Alert, AlertSchema } from '@tmlmobilidade/services/types';
import { createContext, useContext } from 'react';

interface AlertDetailContextState {
	form: UseFormReturnType<Alert>
}

const AlertDetailContext = createContext<AlertDetailContextState | undefined>(undefined);

export function useAlertDetailContext() {
	const context = useContext(AlertDetailContext);
	if (!context) {
		throw new Error('useAlertDetailContext must be used within a AlertDetailContextProvider');
	}
	return context;
}

export const AlertDetailContextProvider = ({ alert, children }: { alert: Alert, children: React.ReactNode }) => {
	//
	// E. Form data
	const form = useForm<Alert>({
		validate: zodResolver(AlertSchema),
	});
	//
	// F. Render components
	return (
		<AlertDetailContext.Provider value={{ form }}>
			{children}
		</AlertDetailContext.Provider>
	);
};
