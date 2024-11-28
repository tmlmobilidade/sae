'use client';

import { useForm, UseFormReturnType, zodResolver } from '@mantine/form';
import { Alert, AlertSchema, Municipality, Stop } from '@tmlmobilidade/services/types';
import { createContext, useContext, useEffect, useState } from 'react';
import useSWR from 'swr';

type AlertFormReferenceSection = 'agencies' | 'lines' | 'stops';
export const AlertFormReferenceSectionOptions: AlertFormReferenceSection[] = ['lines', 'stops', 'agencies'];

interface AlertDetailContextState {
	actions: {
		setAlertFormReferenceSection: (value: AlertFormReferenceSection) => void
	}
	data: {
		agencies: unknown[]
		form: UseFormReturnType<Alert>
		lines: unknown[]
		municipalities: Municipality[]
		routes: unknown[]
		stops: Stop[]
	}
	flags: {
		formReferenceSection: AlertFormReferenceSection
		isReadOnly: boolean
		loading: boolean
	}
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
	// A. Define state
	const [loading, setLoading] = useState(false);

	const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
	const [stops, setStops] = useState<Stop[]>([]);
	const [agencies] = useState<unknown[]>(['Carris Metropolitana']);
	const [lines, setLines] = useState<unknown[]>([]);
	const [routes, setRoutes] = useState<unknown[]>([]);

	const [formReferenceSection, setAlertFormReferenceSection] = useState<AlertFormReferenceSection>('lines');

	const { data: municipalitiesData } = useSWR(process.env.NEXT_PUBLIC_CMET_API_URL + '/locations/municipalities');
	const { data: stopsData } = useSWR(process.env.NEXT_PUBLIC_CMET_API_URL + '/stops');
	const { data: linesData } = useSWR(process.env.NEXT_PUBLIC_CMET_API_URL + '/lines');
	const { data: routesData } = useSWR(process.env.NEXT_PUBLIC_CMET_API_URL + '/routes');

	//
	// B. Define form
	const form = useForm<Alert>({
		initialValues: alert,
		validate: zodResolver(AlertSchema),
		validateInputOnBlur: true,
		validateInputOnChange: true,
	});

	//
	// C. Transform data

	// Municipality
	useEffect(() => {
		if (municipalitiesData) setMunicipalities(municipalitiesData);
	}, [municipalitiesData]);

	// Stop
	useEffect(() => {
		if (stopsData) setStops(stopsData);
	}, [stopsData]);

	// Route
	useEffect(() => {
		if (routesData) setRoutes(routesData);
	}, [routesData]);

	// Line
	useEffect(() => {
		if (linesData) setLines(linesData);
	}, [linesData]);

	// Update form
	useEffect(() => {
		setLoading(true);
		form.setValues(alert);
		setLoading(false);
	}, [alert]);

	//
	// D. Define context value
	const contextValue: AlertDetailContextState = {
		actions: {
			setAlertFormReferenceSection,
		},
		data: {
			agencies,
			form,
			lines,
			municipalities,
			routes,
			stops,
		},
		flags: {
			formReferenceSection,
			isReadOnly: false,
			loading,
		},
	};

	//
	// E. Render components
	return (
		<AlertDetailContext.Provider value={contextValue}>
			{children}
		</AlertDetailContext.Provider>
	);
};
