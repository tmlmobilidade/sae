"use client"

import { Alert, AlertSchema } from "@tmlmobilidade/core-types";
import { useForm, UseFormReturnType, zodResolver } from "@tmlmobilidade/ui";
import { createContext, useContext, useEffect, useState } from "react";

interface AlertDetailContextState {
	actions: {
		addReference: () => void
		removeReference: (index: number) => void
		saveAlert: () => void
	}
	data: {
		form: UseFormReturnType<Alert>
		id: string | undefined
	}
	flags: {
		isReadOnly: boolean
		isSaving: boolean
		loading: boolean
	}
}

const emptyAlert: Alert = {
	_id: 'NEW_ALERT',
	active_period_end_date: new Date(),
	active_period_start_date: new Date(),
	cause: 'ACCIDENT',
	created_at: new Date(),
	description: '',
	effect: 'ACCESSIBILITY_ISSUE',
	municipality_ids: [],
	publish_end_date: new Date(),
	publish_start_date: new Date(),
	publish_status: 'UNPUBLISHED',
	reference_type: 'stop',
	references: [],
	title: '',
	updated_at: new Date(),
	created_by: "",
	modified_by: "",
};

const AlertDetailContext = createContext<AlertDetailContextState | undefined>(undefined);

export function useAlertDetailContext() {
	const context = useContext(AlertDetailContext);
	if (!context) {
		throw new Error('useAlertDetailContext must be used within a AlertDetailContextProvider');
	}
	return context;
}

export const AlertDetailContextProvider = ({ alert, children }: { alert?: Alert, children: React.ReactNode }) => {
	//
	// A. Define state
	const [loading, setLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isReadOnly, setIsReadOnly] = useState(false);

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

	const saveAlert = () => {
		throw new Error('Not implemented');
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
			form,
			id: alert?._id,
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
}
