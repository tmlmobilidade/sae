'use client';

import { type WorkerMessage } from '@/types/worker';
import { API_ROUTES, PAGE_ROUTES } from '@tmlmobilidade/consts';
import { type ValidationCreateItem, ValidationCreateItemSchema } from '@tmlmobilidade/go-operation-pckg-types';
import { type GtfsValidation } from '@tmlmobilidade/go-types-operation';
import { fetchApiMultipart, keepUrlParams, type SelectDataItem, type StandardFormContextValue, useHandleAction, useStandardForm, useStandardFormCapabilities, useToast } from '@tmlmobilidade/ui';
import { useRouter } from 'next/navigation';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useValidationsListData } from '../list/use-validations-list-data';
import { useGtfsValidationsAgenciesData } from '../shared/use-gtfs-validations-agencies-data';
import { closeCreateValidationModal } from './ValidationCreate.modal';

/* * */

interface CreateValidationRequest {
	agencyId: string
	file: File
	gtfsAgency: ValidationCreateItem['gtfs_agency']
	gtfsFeedInfo: ValidationCreateItem['gtfs_feed_info']
}

interface ValidationCreateContextValue extends StandardFormContextValue<ValidationCreateItem> {
	actions: StandardFormContextValue<ValidationCreateItem>['actions'] & {
		setSelectedAgencyId: (agencyId: null | string) => void
		setValidationFile: (file: File | null) => void
	}
	data: {
		agencyOptions: SelectDataItem[]
		selectedAgencyId: null | string
		validationError: Error | null
	}
}

/* * */

const ValidationCreateContext = createContext<undefined | ValidationCreateContextValue>(undefined);

export function useValidationCreateContext() {
	const context = useContext(ValidationCreateContext);
	if (!context) throw new Error('useValidationCreateContext must be used within a ValidationCreateContextProvider');
	return context;
}

/* * */

export function ValidationCreateContextProvider({ children }: PropsWithChildren) {
	//

	//
	// A. Setup variables

	const router = useRouter();

	const { mutate } = useValidationsListData();

	const [gtfsAgencyCode, setGtfsAgencyCode] = useState<null | string>(null);
	const [selectedAgencyId, setSelectedAgencyId] = useState<null | string>(null);
	const [validationFile, setValidationFile] = useState<File | null>(null);
	const [validationError, setValidationError] = useState<Error | null>(null);

	//
	// B. Setup form

	const { form, isDirty, isValid, unblock } = useStandardForm<ValidationCreateItem, typeof ValidationCreateItemSchema>({
		schema: ValidationCreateItemSchema,
	});

	//
	// C. Fetch data

	const { data: permittedAgencies, error: agenciesError, isLoading: agenciesLoading } = useGtfsValidationsAgenciesData({
		permissions: { actions: ['create'], scope: 'gtfs_validations' },
	});

	//
	// D. Transform data

	const matchingAgencies = useMemo(() => {
		if (!gtfsAgencyCode) return [];
		const normalizedGtfsAgencyCode = gtfsAgencyCode.trim().toLowerCase();
		return permittedAgencies.filter(agency => agency.code.trim().toLowerCase() === normalizedGtfsAgencyCode);
	}, [gtfsAgencyCode, permittedAgencies]);

	const agencyOptions = useMemo(() => matchingAgencies.map(agency => ({
		label: `${agency._id} - ${agency.name}`,
		value: agency._id,
	})), [matchingAgencies]);

	const hasCreatePermission = useMemo(() => {
		if (!selectedAgencyId) return false;
		return matchingAgencies.some(agency => agency._id === selectedAgencyId);
	}, [matchingAgencies, selectedAgencyId]);

	//
	// E. Handle actions

	const handleWorkerMessage = useCallback((event: MessageEvent<WorkerMessage>) => {
		if (event.data.error) {
			setValidationError(event.data.error);
			useToast.error({ message: event.data.error.message, title: 'Erro ao criar Validação' });
			return;
		}

		setValidationError(null);
		setGtfsAgencyCode(event.data.agency.agency_id);
		form.setValue('gtfs_agency', event.data.agency, { shouldDirty: true, shouldValidate: true });
		form.setValue('gtfs_feed_info', event.data.feed_info, { shouldDirty: true, shouldValidate: true });
	}, [form]);

	const selectAgency = useCallback((agencyId: null | string) => {
		setSelectedAgencyId(
			agencyId && matchingAgencies.some(agency => agency._id === agencyId)
				? agencyId
				: null,
		);
	}, [matchingAgencies]);

	const { action: handleCreate, isLoading: isCreating } = useHandleAction<GtfsValidation, CreateValidationRequest>({
		fetchFn: async ({ agencyId, file, gtfsAgency, gtfsFeedInfo }) => {
			const uploadFormData = new FormData();
			uploadFormData.append('agency_id', agencyId);
			uploadFormData.append('gtfs_agency', JSON.stringify(gtfsAgency));
			uploadFormData.append('gtfs_feed_info', JSON.stringify(gtfsFeedInfo));
			uploadFormData.append('file', file);
			return await fetchApiMultipart<GtfsValidation>(API_ROUTES.operation.GTFS_VALIDATIONS_CREATE, uploadFormData);
		},
		labels: {
			error_title: 'Erro ao iniciar Validação',
			success_message: 'Validação em progresso.',
			success_title: 'Sucesso',
		},
		onSuccess: ({ data }) => {
			closeCreateValidationModal();
			form.reset();
			unblock();
			mutate();
			if (!data?._id) return;
			router.push(keepUrlParams(PAGE_ROUTES.operation.GTFS_VALIDATIONS_DETAIL(data._id)));
		},
	});

	const createValidation = useCallback(() => {
		if (!selectedAgencyId || !validationFile) return;
		const formValues = form.getValues();
		if (!formValues.gtfs_agency || !formValues.gtfs_feed_info) return;
		return handleCreate({
			agencyId: selectedAgencyId,
			file: validationFile,
			gtfsAgency: formValues.gtfs_agency,
			gtfsFeedInfo: formValues.gtfs_feed_info,
		});
	}, [form, handleCreate, selectedAgencyId, validationFile]);

	//
	// F. Handle effects

	useEffect(() => {
		if (!gtfsAgencyCode || agenciesLoading) return;

		if (agenciesError || matchingAgencies.length === 0) {
			setSelectedAgencyId(null);
			setValidationError(new Error('Não é permitido criar validações para esta agência.'));
			return;
		}

		setValidationError(null);

		if (matchingAgencies.length === 1) {
			setSelectedAgencyId(matchingAgencies[0]._id);
			return;
		}

		setSelectedAgencyId(currentAgencyId => (
			matchingAgencies.some(agency => agency._id === currentAgencyId)
				? currentAgencyId
				: null
		));
	}, [agenciesError, agenciesLoading, gtfsAgencyCode, matchingAgencies]);

	useEffect(() => {
		setGtfsAgencyCode(null);
		setSelectedAgencyId(null);
		setValidationError(null);
		form.reset();

		if (!validationFile) return;

		const worker = new Worker(new URL('@/workers/gtfs-info.worker.ts', import.meta.url));
		worker.onmessage = handleWorkerMessage;
		worker.postMessage({ file: validationFile });

		return () => {
			worker.terminate();
		};
	}, [form, handleWorkerMessage, validationFile]);

	//
	// G. Setup flags

	const { createEnabled } = useStandardFormCapabilities({
		create: {
			hasPermission: hasCreatePermission && !!validationFile,
			isCreating,
		},
		form: {
			isDirty,
			isValid,
		},
		loading: {
			isLoading: agenciesLoading,
		},
	});

	//
	// H. Define context value

	const stateValue: ValidationCreateContextValue = useMemo(() => ({
		actions: {
			create: createValidation,
			setSelectedAgencyId: selectAgency,
			setValidationFile,
		},
		capabilities: {
			createEnabled,
		},
		data: {
			agencyOptions,
			selectedAgencyId,
			validationError,
		},
		form,
		isDirty,
		isValid,
		status: {
			isCreating,
		},
		unblock,
	}), [agencyOptions, createEnabled, createValidation, form, isCreating, isDirty, isValid, selectAgency, selectedAgencyId, unblock, validationError]);

	//
	// I. Render components

	return (
		<ValidationCreateContext.Provider value={stateValue}>
			{children}
		</ValidationCreateContext.Provider>
	);

	//
}
