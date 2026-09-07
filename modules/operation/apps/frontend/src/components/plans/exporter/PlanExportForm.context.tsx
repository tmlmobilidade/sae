'use client';

import { usePlansAgenciesData } from '@/components/plans/shared/use-plans-agencies-data';
import { usePlansExportListData } from '@/components/plans/shared/use-plans-export-list-data';
import { type PlansListItem } from '@tmlmobilidade/go-operation-pckg-types';
import { type CreateFileExportDto, type PlanPostersExportProperties } from '@tmlmobilidade/go-types-downloads';
import { closeModal, type SelectDataItem, useExportsContext, useToast } from '@tmlmobilidade/ui';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { PLAN_EXPORT_MODAL_ID } from './PlanExportModal/constants';

/* * */

interface PlanExportModalContextState {
	actions: {
		exportPlan: () => Promise<void>
		setAgencyId: (value: null | string) => void
		setPlanId: (value: null | string) => void
	}
	data: {
		agencyId: null | string
		agencyOptions: SelectDataItem[]
		planId: null | string
		plans: PlansListItem[]
	}
	flags: {
		canSave: boolean
		loading: boolean
	}
}

/* * */

const PlanExportModalContext = createContext<PlanExportModalContextState | undefined>(undefined);

export function usePlanExportModalContext() {
	const context = useContext(PlanExportModalContext);
	if (!context) {
		throw new Error('usePlanExportModalContext must be used within a PlanExportModalContextProvider');
	}
	return context;
}

/* * */

export const PlanExportModalContextProvider = ({ children }: PropsWithChildren) => {
	//

	//
	// A. Setup variables

	const exports = useExportsContext();
	const [agencyId, setAgencyId] = useState<null | string>(null);
	const [planId, setPlanId] = useState<null | string>(null);
	const [loading, setLoading] = useState(false);

	const { options } = usePlansAgenciesData();

	const plansData = usePlansExportListData(agencyId);

	//
	// B. Derived state

	const canSave = !!agencyId && !!planId;

	//
	// C. Handle actions

	const selectAgencyId = useCallback((value: null | string) => {
		setAgencyId(value);
		setPlanId(null);
	}, []);

	const selectPlanId = useCallback((value: null | string) => {
		const selectedPlan = plansData.data.find(plan => plan._id === value && plan.agency_id === agencyId);

		setPlanId(selectedPlan?._id ?? null);
	}, [agencyId, plansData.data]);

	useEffect(() => {
		const selectedAgencyIsAvailable = options.some(option => option.value === agencyId);

		if (options.length === 1 && agencyId !== options[0].value) {
			selectAgencyId(options[0].value);
		} else if (options.length > 1 && agencyId && !selectedAgencyIsAvailable) {
			selectAgencyId(null);
		}
	}, [agencyId, options, selectAgencyId]);

	const exportPlan = useCallback(async () => {
		if (loading) return;

		if (!agencyId || !planId) return;

		const selectedPlan = plansData.data.find(plan => plan._id === planId && plan.agency_id === agencyId);
		if (!selectedPlan) return;

		const createFileExportDto: CreateFileExportDto<PlanPostersExportProperties> = {
			created_by: 'will-be-set-by-api',
			file_id: null,
			file_name: `gtfs-${selectedPlan._id}.zip`,
			processing_status: 'waiting',
			properties: {
				agency_id: agencyId,
				plan_id: planId,
			},
			type: 'plan_posters',
		};

		try {
			setLoading(true);
			const fileExport = await exports.actions.create(createFileExportDto);
			if (!fileExport) return;
			useToast.success({ message: 'A exportação do plano foi iniciada', title: 'Sucesso' });
			closeModal(PLAN_EXPORT_MODAL_ID);
		} catch (error) {
			useToast.error({ message: error instanceof Error ? error.message : 'Erro ao iniciar a exportação do plano', title: 'Erro' });
		} finally {
			setLoading(false);
		}
	}, [agencyId, exports.actions, loading, planId, plansData.data]);

	//
	// D. Define context value

	const contextValue: PlanExportModalContextState = useMemo(() => ({
		actions: {
			exportPlan,
			setAgencyId: selectAgencyId,
			setPlanId: selectPlanId,
		},
		data: {
			agencyId,
			agencyOptions: options,
			planId,
			plans: plansData.data,
		},
		flags: {
			canSave,
			loading,
		},
	}), [agencyId, options, canSave, exportPlan, loading, planId, plansData.data, selectAgencyId, selectPlanId]);

	//
	// E. Render components

	return (
		<PlanExportModalContext.Provider value={contextValue}>
			{children}
		</PlanExportModalContext.Provider>
	);

	//
};
