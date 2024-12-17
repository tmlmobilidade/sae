'use client';

import type { Route, Stop } from '@carrismetropolitana/api-types/network';

import { createAlert, updateAlert } from '@/actions/alerts';
import toast from '@/utils/toast';
import { useForm, UseFormReturnType, zodResolver } from '@mantine/form';
import { Alert, AlertSchema, CreateAlertSchema, Municipality, UpdateAlertSchema } from '@tmlmobilidade/services/types';
import { convertObject } from '@tmlmobilidade/services/utils';
import { createContext, useContext, useEffect, useState } from 'react';
import useSWR from 'swr';

import { useAlertsListContext } from './AlertList.context';

interface AlertDetailContextState {
	actions: {
		addReference: () => void
		removeReference: (index: number) => void
		saveAlert: () => void
	}
	data: {
		agencies: unknown[]
		form: UseFormReturnType<Alert>
		id: string
		municipalities: Municipality[]
		routes: Route[]
		stops: Stop[]
	}
	flags: {
		isReadOnly: boolean
		isSaving: boolean
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
	const [isSaving, setIsSaving] = useState(false);
	const alertsListContext = useAlertsListContext();

	const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
	const [stops, setStops] = useState<Stop[]>([]);
	const [agencies] = useState<unknown[]>(['Carris Metropolitana']);
	const [routes, setRoutes] = useState<Route[]>([]);

	const { data: municipalitiesData } = useSWR(process.env.NEXT_PUBLIC_CMET_API_URL + '/locations/municipalities');
	const { data: stopsData } = useSWR(process.env.NEXT_PUBLIC_CMET_API_URL + '/stops');
	// const { data: linesData } = useSWR(process.env.NEXT_PUBLIC_CMET_API_URL + '/lines');
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

	// Update form
	useEffect(() => {
		setLoading(true);

		if (!alert.reference_type) {
			alert.reference_type = 'route';
			alert.references = [];
		}

		form.reset();
		form.setValues(alert);
		form.resetDirty();

		setLoading(false);
	}, [alert]);

	//
	// D. Define actions
	const addReference = () => {
		const currentReferences = form.values.references || [];
		currentReferences.push({ child_ids: [], parent_id: '' });
		form.setFieldValue('references', currentReferences);
	};

	const removeReference = (index: number) => {
		const currentReferences = form.values.references || [];
		form.setFieldValue('references', currentReferences.filter((_, i) => i !== index));
	};

	const saveAlert = async () => {
		try {
			setIsSaving(true);
			const formValues = form.getValues();

			if (alert._id === 'NEW_ALERT') {
				const createAlertDto = convertObject(formValues, CreateAlertSchema);
				const newAlert = await createAlert(createAlertDto);
				toast.success({ message: 'Aviso criado com sucesso' });
				console.log('newAlert', newAlert);
				alertsListContext.actions.refresh();
				//@ts-ignore TODO: Fix this
				alertsListContext.actions.setSelectedId(newAlert.data.insertedId.toString());
			}
			else {
				await updateAlert(alert._id, convertObject(formValues, UpdateAlertSchema));
				alertsListContext.actions.updateAlert(formValues);
				toast.success({ message: 'Aviso atualizado com sucesso' });
			}
		}
		catch (error) {
			console.error('Error saving alert:', error);
			toast.error({
				message: alert._id === 'NEW_ALERT'
					? 'Erro ao criar alerta'
					: 'Erro ao atualizar alerta',
			});
		}
		finally {
			setIsSaving(false);
		}
	};

	//
	// E. Define context value
	const contextValue: AlertDetailContextState = {
		actions: {
			addReference,
			removeReference,
			saveAlert,
		},
		data: {
			agencies,
			form,
			id: alert._id,
			municipalities,
			routes,
			stops,
		},
		flags: {
			isReadOnly: false,
			isSaving,
			loading,
		},
	};

	//
	// F. Render components
	return (
		<AlertDetailContext.Provider value={contextValue}>
			{children}
		</AlertDetailContext.Provider>
	);
};
