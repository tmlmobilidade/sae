'use client';

import { closePlanChangeModal } from '@/components/plans/change/PlanChange.modal';
import { usePlansListData } from '@/components/plans/list/use-plans-list-data';
import { useValidationsListData } from '@/components/gtfs-validations/list/use-validations-list-data';
import { API_ROUTES } from '@tmlmobilidade/consts';
import { type PlanChangeItem, PlanChangeItemSchema, type ValidationListItem } from '@tmlmobilidade/go-operation-pckg-types';
import { type Plan } from '@tmlmobilidade/go-types-operation';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { type ApiResponse } from '@tmlmobilidade/go-types-shared';
import { fetchApiData, type StandardFormContextValue, useHandleAction, useMeData, useStandardForm, useStandardFormCapabilities, useStandardFormWatch, useToast } from '@tmlmobilidade/ui';
import { createContext, type PropsWithChildren, useCallback, useContext, useMemo } from 'react';
import useSWR from 'swr';

/* * */

interface PlanChangeContextValue extends StandardFormContextValue<PlanChangeItem> {
	data: {
		availableValidations: ValidationListItem[]
		error: null | string
		plan: Plan | undefined
	}
}

/* * */

const PlanChangeContext = createContext<PlanChangeContextValue | undefined>(undefined);

export function usePlanChangeContext() {
	const context = useContext(PlanChangeContext);
	if (!context) throw new Error('usePlanChangeContext must be used within a PlanChangeContextProvider');
	return context;
}

/* * */

export function PlanChangeContextProvider({ children, planId }: PropsWithChildren<{ planId: string }>) {
	//

	//
	// A. Setup variables

	const { data: meData } = useMeData();
	const { mutate: plansListMutate } = usePlansListData();

	//
	// B. Setup form

	const { form, isDirty, isValid, unblock } = useStandardForm<PlanChangeItem, typeof PlanChangeItemSchema>({
		defaultValues: {
			validation_id: '',
		},
		schema: PlanChangeItemSchema,
	});

	const selectedValidationId = useStandardFormWatch({
		control: form.control,
		name: 'validation_id',
	});

	//
	// C. Fetch data

	const { data: planResponse, error: planSwrError, isLoading: planLoading, mutate: planMutate } = useSWR<ApiResponse<Plan>>(API_ROUTES.operation.PLANS_DETAIL(planId), {
		fetcher: async (url: string) => await fetchApiData<Plan>({ url }),
	});

	const { data: validationsData, error: validationsError, isLoading: validationsLoading } = useValidationsListData();

	//
	// D. Transform data

	const planData = planResponse?.data ?? undefined;

	const availableValidations = useMemo(() => {
		if (!planData) return [];
		return validationsData.filter(item => (
			item.agency_id === planData.agency_id
			&& item.processing_status === 'complete'
			&& item.validity_status === 'valid'
		));
	}, [planData, validationsData]);

	const selectedValidation = useMemo(() => {
		if (!selectedValidationId) return undefined;
		return availableValidations.find(item => item._id === selectedValidationId);
	}, [availableValidations, selectedValidationId]);

	const selectedValidationIsValid = selectedValidation?.summary?.total_errors === 0;

	const error = planResponse?.error ?? (planSwrError instanceof Error ? planSwrError.message : null) ?? validationsError;

	//
	// E. Handle actions

	const { action: handleUpdate, isLoading: isUpdating } = useHandleAction<Plan>({
		fetchFn: async () => await fetchApiData<Plan>({
			body: form.getValues(),
			method: 'POST',
			url: API_ROUTES.operation.PLANS_DETAIL_CHANGE_GTFS(planId),
		}),
		onSuccess: (response) => {
			form.reset();
			unblock();
			planMutate(response);
			plansListMutate();
			closePlanChangeModal();
		},
	});

	const updatePlan = useCallback(() => {
		if (!selectedValidation) {
			useToast.error({ message: 'Selecione uma validação antes de alterar o plano.', title: 'Erro' });
			return;
		}

		if (!selectedValidationIsValid) {
			useToast.error({ message: 'Não é possível alterar o plano com uma validação que contém erros.', title: 'Erro' });
			return;
		}

		return handleUpdate();
	}, [handleUpdate, selectedValidation, selectedValidationIsValid]);

	//
	// F. Setup flags

	const hasUpdatePermission = useMemo(() => {
		if (!planData) return false;
		return PermissionCatalog.hasPermissionResource({
			action: PermissionCatalog.all.plans.actions.update_gtfs_plan,
			permissions: meData?.permissions ?? [],
			resource_key: 'agency_ids',
			scope: PermissionCatalog.all.plans.scope,
			value: planData.agency_id,
		});
	}, [meData?.permissions, planData]);

	const { editEnabled, updateEnabled } = useStandardFormCapabilities({
		form: {
			isDirty,
			isValid: isValid && selectedValidationIsValid,
		},
		loading: {
			isLoading: planLoading || validationsLoading,
		},
		update: {
			hasPermission: hasUpdatePermission,
			isUpdating,
		},
	});

	//
	// G. Define context value

	const stateValue: PlanChangeContextValue = useMemo(() => ({
		actions: {
			update: updatePlan,
		},
		capabilities: {
			editEnabled,
			updateEnabled,
		},
		data: {
			availableValidations,
			error,
			plan: planData,
		},
		form,
		isDirty,
		isValid,
		status: {
			isLoading: planLoading || validationsLoading,
			isUpdating,
		},
		unblock,
	}), [availableValidations, editEnabled, error, form, isDirty, isUpdating, isValid, planData, planLoading, unblock, updateEnabled, updatePlan, validationsLoading]);

	//
	// H. Render components

	return (
		<PlanChangeContext.Provider value={stateValue}>
			{children}
		</PlanChangeContext.Provider>
	);

	//
}
