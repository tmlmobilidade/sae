"use client"

import { fetchData, swrFetcher } from "@/lib/http";
import { Routes } from "@/lib/routes";
import { Alert, AlertSchema, convertObject, UpdateAlertSchema } from "@tmlmobilidade/core-types";
import { useForm, UseFormReturnType, useToast, zodResolver } from "@tmlmobilidade/ui";
import { createContext, useContext, useEffect, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";

export enum AlertDetailMode {
	CREATE = 'create',
	EDIT = 'edit',
}

interface AlertDetailContextState {
	actions: {
		addReference: () => void
		removeReference: (index: number) => void
		saveAlert: () => void
		deleteAlert: () => void
	}
	data: {
		form: UseFormReturnType<Alert>
		id: string | undefined
	}
	flags: {
		canSave: boolean
		isReadOnly: boolean
		isSaving: boolean
		loading: boolean
		mode: AlertDetailMode
	}
}

const emptyAlert: Alert = {
	_id: '',
	active_period_end_date: new Date(),
	active_period_start_date: new Date(),
	cause: 'ACCIDENT',
	description: '',
	effect: 'ACCESSIBILITY_ISSUE',
	municipality_ids: [],
	publish_end_date: new Date(),
	publish_start_date: new Date(),
	publish_status: 'DRAFT',
	reference_type: 'stop',
	references: [],
	title: '',
	created_by: "temp",
	modified_by: "temp",
};

const AlertDetailContext = createContext<AlertDetailContextState | undefined>(undefined);

export function useAlertDetailContext() {
	const context = useContext(AlertDetailContext);
	if (!context) {
		throw new Error('useAlertDetailContext must be used within a AlertDetailContextProvider');
	}
	return context;
}

export const AlertDetailContextProvider = ({ alertId, children }: { alertId: string, children: React.ReactNode }) => {
	
	//
	// A. Setup variables
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isReadOnly, setIsReadOnly] = useState(false);
	const [canSave, setCanSave] = useState(false);

	const {data: alert, isLoading, error } = useSWR<Alert>(alertId === 'new' ? null : Routes.ALERTS_API + Routes.ALERT_DETAIL(alertId), swrFetcher);

	//
	// B. Define form
	const form = useForm<Alert>({
		initialValues: alert || emptyAlert,
		validate: zodResolver(AlertSchema),
		validateInputOnBlur: true,
		validateInputOnChange: true,
	});

	//
	// C. Transform Data

	// Update form
	useEffect(() => {
		if (!alert) return;

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

	useEffect(() => {
		if (error) {
			useToast.error({
				title: 'Erro ao carregar alerta',
				message: error.message,
			});
			router.replace(Routes.ALERT_LIST);
		}
	}, [error]);	

	// Validate form on change
	useEffect(() => {
		form.validate();
		setCanSave(form.isValid());
	}, [form.values]);

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
		setIsSaving(true);
		
		// Handle Image Upload
		const saveAlert: Alert = { ...form.values, publish_status: 'PUBLISHED' };
		
		const method = alertId === 'new' ? 'POST' : 'PUT';
		const url = alertId === 'new' ? Routes.ALERTS_API + Routes.ALERT_LIST : Routes.ALERTS_API + Routes.ALERT_DETAIL(alertId);
		const body = alertId === 'new' ? saveAlert : convertObject(saveAlert, UpdateAlertSchema);

		const response = await fetchData<Alert>(url, method, body);
		
		if (response.error) {
			const errors = JSON.parse(response.error);
			for (const error of errors) {
				useToast.error({
					title: 'Erro ao salvar alerta',
					message: error.message,
				});
			}

			return;
		}


		useToast.success({
			title: 'Sucesso',
			message: 'Alerta salvo com sucesso',
		});

		router.replace(Routes.ALERT_LIST);

		setIsSaving(false);
	};

	const deleteAlert = async () => {
		if (alertId === 'new') return;

		const response = await fetchData<Alert>(Routes.ALERTS_API + Routes.ALERT_DETAIL(alertId), 'DELETE', alert);
		if (response.error) {
			const errors = JSON.parse(response.error);
			for (const error of errors) {
				useToast.error({
					title: 'Erro ao salvar alerta',
					message: error.message,
				});
			}
			return;
		}

		useToast.success({
			title: 'Sucesso',
			message: 'Alerta apagado com sucesso',
		});

		router.replace(Routes.ALERT_LIST);
	};

	//
	// E. Define context value
	const contextValue: AlertDetailContextState = {
		actions: {
			addReference,
			removeReference,
			saveAlert,
			deleteAlert,
		},
		data: {
			form,
			id: alertId,
		},
		flags: {
			canSave,
			isReadOnly,
			isSaving,
			loading: isLoading || loading,
			mode: alertId === 'new' ? AlertDetailMode.CREATE : AlertDetailMode.EDIT,
		},
	};

	//
	// F. Render components
	return (
		<AlertDetailContext.Provider value={contextValue}>
			{children}
		</AlertDetailContext.Provider>
	);
}
