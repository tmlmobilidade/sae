'use client';

import { API_ROUTES, PAGE_ROUTES } from '@tmlmobilidade/consts';
import { type Alert, type UpdateAlertDto, UpdateAlertSchema } from '@tmlmobilidade/go-types-operation';
import { hasPermissionResource } from '@tmlmobilidade/go-types-permissions';
import { type StandardFormContextValue, useMeData, useStandardForm, useStandardFormCapabilities } from '@tmlmobilidade/ui';
import { fetchApiData, useHandleAction } from '@tmlmobilidade/ui';
import { useRouter } from 'next/navigation';
import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';

import { useAlertsListData } from '../list/use-alerts-list-data';
import { useAlertsDetailAlertId } from './use-alerts-detail-alert-id';
import { useAlertsDetailData } from './use-alerts-detail-data';

/* * */

const AlertsDetailFormContext = createContext<StandardFormContextValue<UpdateAlertDto> | undefined>(undefined);

export function useAlertsDetailFormContext() {
	const context = useContext(AlertsDetailFormContext);
	if (!context) throw new Error('useAlertsDetailFormContext must be used within a AlertsDetailFormContextProvider');
	return context;
}

/* * */

export function AlertsDetailFormContextProvider({ children }: PropsWithChildren) {
	//

	//
	// A. Setup variables

	const { alertId } = useAlertsDetailAlertId();

	const { data: meData } = useMeData();

	const { mutate: alertsListMutate } = useAlertsListData();

	const { data: alertData, isLoading: alertDataLoading, mutate: alertsDetailMutate } = useAlertsDetailData();

	const router = useRouter();

	//
	// B. Setup form

	const { form, isDirty, isValid, unblock } = useStandardForm<UpdateAlertDto, typeof UpdateAlertSchema>({
		apiData: alertData,
		schema: UpdateAlertSchema,
	});

	//
	// C. Handle actions

	const { action: handleUpdate, isLoading: isUpdating } = useHandleAction({
		fetchFn: async () => await fetchApiData<Alert>({ body: form.getValues(), method: 'PUT', url: API_ROUTES.operation.ALERTS_DETAIL(alertId) }),
		onSuccess: (response) => {
			form.reset(response.data);
			alertsDetailMutate(response);
			alertsListMutate();
		},
	});

	const { action: handleDuplicate, isLoading: isDuplicating } = useHandleAction({
		fetchFn: async () => await fetchApiData<Alert>({ body: form.getValues(), method: 'POST', url: API_ROUTES.operation.ALERTS_DETAIL_DUPLICATE(alertId) }),
		onSuccess: (response) => {
			form.reset(response.data);
			unblock();
			alertsDetailMutate(response);
			alertsListMutate();
			router.push(PAGE_ROUTES.operation.ALERTS_DETAIL(response.data._id));
		},
	});

	const { action: handleDelete, isLoading: isDeleting } = useHandleAction({
		fetchFn: async () => await fetchApiData<Alert>({ body: form.getValues(), method: 'DELETE', url: API_ROUTES.operation.ALERTS_DETAIL(alertId) }),
		onSuccess: () => {
			unblock();
			alertsListMutate();
			router.push(PAGE_ROUTES.operation.ALERTS_LIST);
		},
	});

	//
	// D. Setup flags

	const hasUpdatePermission = useMemo(() => {
		const hasPermissionAgencyId = hasPermissionResource(meData?.permissions, {
			requiredPermission: { action: 'update', scope: 'alerts' },
			requiredValue: alertData?.agency_id,
			resourceKey: 'agency_ids',
		});
		const hasPermissionReferenceType = hasPermissionResource(meData?.permissions, {
			requiredPermission: { action: 'update', scope: 'alerts' },
			requiredValue: alertData?.reference_type,
			resourceKey: 'reference_types',
		});
		return hasPermissionAgencyId && hasPermissionReferenceType;
	}, [alertData?.agency_id, alertData?.reference_type, meData?.permissions]);

	const hasDuplicatePermission = useMemo(() => {
		const hasPermissionAgencyId = hasPermissionResource(meData?.permissions, {
			requiredPermission: { action: 'create', scope: 'alerts' },
			requiredValue: alertData?.agency_id,
			resourceKey: 'agency_ids',
		});
		const hasPermissionReferenceType = hasPermissionResource(meData?.permissions, {
			requiredPermission: { action: 'create', scope: 'alerts' },
			requiredValue: alertData?.reference_type,
			resourceKey: 'reference_types',
		});
		return hasPermissionAgencyId && hasPermissionReferenceType;
	}, [alertData?.agency_id, alertData?.reference_type, meData?.permissions]);

	const hasDeletePermission = useMemo(() => {
		const hasPermissionAgencyId = hasPermissionResource(meData?.permissions, {
			requiredPermission: { action: 'delete', scope: 'alerts' },
			requiredValue: alertData?.agency_id,
			resourceKey: 'agency_ids',
		});
		const hasPermissionReferenceType = hasPermissionResource(meData?.permissions, {
			requiredPermission: { action: 'delete', scope: 'alerts' },
			requiredValue: alertData?.reference_type,
			resourceKey: 'reference_types',
		});
		return hasPermissionAgencyId && hasPermissionReferenceType;
	}, [alertData?.agency_id, alertData?.reference_type, meData?.permissions]);

	const { deleteEnabled, duplicateEnabled, editEnabled, updateEnabled } = useStandardFormCapabilities({
		delete: {
			hasPermission: hasDeletePermission,
			isDeleting: isDeleting,
		},
		duplicate: {
			hasPermission: hasDuplicatePermission,
			isDuplicating: isDuplicating,
		},
		form: {
			isDirty,
			isValid,
		},
		loading: {
			isLoading: alertDataLoading,
		},
		locked: {
			isLocked: alertData?.is_locked,
		},
		update: {
			hasPermission: hasUpdatePermission,
			isUpdating: isUpdating,
		},
	});

	//
	// E. Return state

	const stateValue: StandardFormContextValue<UpdateAlertDto> = useMemo(() => ({
		actions: {
			delete: handleDelete,
			duplicate: handleDuplicate,
			update: handleUpdate,
		},
		capabilities: {
			deleteEnabled,
			duplicateEnabled,
			editEnabled,
			updateEnabled,
		},
		form,
		isDirty,
		isValid,
		status: {
			isLoading: alertDataLoading,
			isUpdating,
		},
		unblock,
	}), [handleDelete, handleDuplicate, handleUpdate, deleteEnabled, duplicateEnabled, editEnabled, updateEnabled, form, isDirty, isValid, alertDataLoading, isUpdating, unblock]);

	return (
		<AlertsDetailFormContext.Provider value={stateValue}>
			{children}
		</AlertsDetailFormContext.Provider>
	);
}
