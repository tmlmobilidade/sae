'use client';

import { PLAN_POSTERS_EXPORT_MODAL_ID } from '@/components/plans/posters/PlanPostersModal/constants';
import { usePlansAgenciesData } from '@/components/plans/shared/use-plans-agencies-data';
import { usePlansExportListData } from '@/components/plans/shared/use-plans-export-list-data';
import { usePlansLines } from '@/components/plans/shared/use-plans-lines-data';
import { usePlansStops } from '@/components/plans/shared/use-plans-stops-data';
import { type PlansListItem } from '@tmlmobilidade/go-operation-pckg-types';
import { type CreateFileExportDto, type PlanPostersContentMode, type PlanPostersExportProperties, type PlanPostersFilterMode } from '@tmlmobilidade/go-types-downloads';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { closeModal, type SelectDataItem, useExportsContext, useToast } from '@tmlmobilidade/ui';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/* * */

interface PlansExportPdfsContextState {
	actions: {
		exportPosters: () => Promise<void>
		setAgencyId: (value: null | string) => void
		setCanvasProfile: (value: CanvasProfile | null) => void
		setContentMode: (value: PlanPostersContentMode) => void
		setFilterMode: (value: PlanPostersFilterMode) => void
		setLineIds: (value: string[]) => void
		setPlanId: (value: null | string) => void
		setStopIds: (value: string[]) => void
	}
	data: {
		agencyId: null | string
		agencyOptions: SelectDataItem[]
		canvasProfile: CanvasProfile | null
		contentMode: PlanPostersContentMode
		filterMode: PlanPostersFilterMode
		lineIds: string[]
		lineOptions: SelectDataItem[]
		planId: null | string
		plans: PlansListItem[]
		stopIds: string[]
		stopOptions: SelectDataItem[]
	}
	flags: {
		canSave: boolean
		has_error: boolean
		loading: boolean
	}
}

/* * */

type CanvasProfile = NonNullable<PlanPostersExportProperties['properties']['canvas_profile']>;

/* * */

const PlansExportPdfsContext = createContext<PlansExportPdfsContextState | undefined>(undefined);

export function usePlansExportPdfsContext() {
	const context = useContext(PlansExportPdfsContext);
	if (!context) {
		throw new Error('usePlansExportPdfsContext must be used within a PlansExportPdfsModalContextProvider');
	}
	return context;
}

/* * */

export const PlansExportPdfsModalContextProvider = ({ children }: PropsWithChildren) => {
	//

	//
	// A. Setup variables

	const exports = useExportsContext();
	const [agencyId, setAgencyId] = useState<null | string>(null);
	const [canvasProfile, setCanvasProfile] = useState<CanvasProfile | null>('0Master.C');
	const [contentMode, setContentMode] = useState<PlanPostersContentMode>('all');
	const [filterMode, setFilterMode] = useState<PlanPostersFilterMode>('include');
	const [lineIds, setLineIds] = useState<string[]>([]);
	const [planId, setPlanId] = useState<null | string>(null);
	const [stopIds, setStopIds] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);

	const { options: agencyOptions } = usePlansAgenciesData();

	const plansLines = usePlansLines(agencyId && contentMode === 'lines' ? {
		agency_id: agencyId,
		permissions: {
			actions: [PermissionCatalog.all.plans.actions.generate_pdf_posters],
			scope: PermissionCatalog.all.plans.scope,
		},
	} : null);

	const plansStops = usePlansStops(agencyId && contentMode === 'stops' ? {
		agency_id: agencyId,
		permissions: {
			actions: [PermissionCatalog.all.plans.actions.generate_pdf_posters],
			scope: PermissionCatalog.all.plans.scope,
		},
	} : null);

	const plansData = usePlansExportListData(agencyId);

	//
	// B. Derived state

	const hasSelectedLines = contentMode === 'lines' && lineIds.length > 0;
	const hasSelectedStops = contentMode === 'stops' && stopIds.length > 0;
	const hasSelectedContent = contentMode === 'all' || hasSelectedLines || hasSelectedStops;
	const canSave = !!agencyId && !!planId && hasSelectedContent && (contentMode === 'all' || !!canvasProfile);

	//
	// C. Handle actions

	const selectAgencyId = useCallback((value: null | string) => {
		setAgencyId(value);
		setContentMode('all');
		setFilterMode('include');
		setLineIds([]);
		setPlanId(null);
		setStopIds([]);
	}, []);

	const selectContentMode = useCallback((value: PlanPostersContentMode) => {
		setContentMode(value);
		setFilterMode('include');
		setLineIds([]);
		setStopIds([]);
	}, []);

	const selectFilterMode = useCallback((value: PlanPostersFilterMode) => {
		setFilterMode(value);
		setLineIds([]);
		setStopIds([]);
	}, []);

	const selectPlanId = useCallback((value: null | string) => {
		const selectedPlan = plansData.data.find(plan => plan._id === value && plan.agency_id === agencyId && !!plan.operation_file_id);

		setPlanId(selectedPlan?._id ?? null);
		setLineIds([]);
		setStopIds([]);
	}, [agencyId, plansData.data]);

	useEffect(() => {
		const selectedAgencyIsAvailable = agencyOptions.some(option => option.value === agencyId);

		if (agencyOptions.length === 1 && agencyId !== agencyOptions[0].value) {
			selectAgencyId(agencyOptions[0].value);
		} else if (agencyOptions.length > 1 && agencyId && !selectedAgencyIsAvailable) {
			selectAgencyId(null);
		}
	}, [agencyId, agencyOptions, selectAgencyId]);

	const exportPosters = useCallback(async () => {
		if (loading) return;
		if (!agencyId || !planId) return;
		if (contentMode === 'lines' && (!canvasProfile || !lineIds.length)) return;
		if (contentMode === 'stops' && (!canvasProfile || !stopIds.length)) return;

		const selectedPlan = plansData.data.find(plan => plan._id === planId && plan.agency_id === agencyId);
		if (!selectedPlan?.operation_file_id) return;

		const createFileExportDto: CreateFileExportDto<PlanPostersExportProperties> = {
			created_by: 'will-be-set-by-api',
			file_id: null,
			file_name: `${selectedPlan._id}-pdf.zip`,
			processing_status: 'waiting',
			properties: {
				agency_id: agencyId,
				canvas_profile: contentMode === 'all' ? '0Master.C' : canvasProfile,
				content_mode: contentMode,
				line_ids: contentMode === 'lines' ? lineIds : undefined,
				lines_mode: contentMode === 'lines' ? filterMode : 'all',
				plan_id: planId,
				stop_ids: contentMode === 'stops' ? stopIds : undefined,
				stops_mode: contentMode === 'stops' ? filterMode : undefined,
			},
			type: 'plan_posters',
		};

		try {
			setLoading(true);
			const fileExport = await exports.actions.create(createFileExportDto);
			if (!fileExport) return;
			useToast.success({ message: 'A exportação dos PDFs foi iniciada', title: 'Sucesso' });
			closeModal(PLAN_POSTERS_EXPORT_MODAL_ID);
		} catch (error) {
			useToast.error({ message: error instanceof Error ? error.message : 'Erro ao iniciar a exportação dos PDFs', title: 'Erro' });
		} finally {
			setLoading(false);
		}
	}, [agencyId, canvasProfile, contentMode, exports.actions, filterMode, lineIds, loading, planId, plansData.data, stopIds]);

	//
	// D. Define context value

	const contextValue: PlansExportPdfsContextState = useMemo(() => ({
		actions: {
			exportPosters,
			setAgencyId: selectAgencyId,
			setCanvasProfile,
			setContentMode: selectContentMode,
			setFilterMode: selectFilterMode,
			setLineIds,
			setPlanId: selectPlanId,
			setStopIds,
		},
		data: {
			agencyId,
			agencyOptions,
			canvasProfile,
			contentMode,
			filterMode,
			lineIds,
			lineOptions: plansLines.options,
			planId,
			plans: plansData.data,
			stopIds,
			stopOptions: plansStops.options,
		},
		flags: {
			canSave,
			has_error: !!plansData.error || !!plansLines.error || !!plansStops.error,
			loading,
		},
	}), [agencyId, agencyOptions, canSave, canvasProfile, contentMode, exportPosters, filterMode, lineIds, loading, planId, plansData.data, plansData.error, plansLines.error, plansLines.options, plansStops.error, plansStops.options, selectAgencyId, selectContentMode, selectFilterMode, selectPlanId, stopIds]);

	//
	// E. Render components

	return (
		<PlansExportPdfsContext.Provider value={contextValue}>
			{children}
		</PlansExportPdfsContext.Provider>
	);

	//
};
