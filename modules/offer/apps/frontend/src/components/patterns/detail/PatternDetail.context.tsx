'use client';

import { openCreateRuleModal } from '@/components/patterns/rules/create/RuleCreate.modal';
import { openRulesCalendarPreviewModal } from '@/components/patterns/rules/list/RulesCalendarPreview.modal';
import { openCreateParameterModal } from '@/components/patterns/shape/parameters/create/ParameterCreate.modal';
import { useEventsContext } from '@/contexts/Events.context';
import { usePeriodsContext } from '@/contexts/Periods.context';
import { StopsParameterExtended } from '@/utils/stops-parameters';
import { API_ROUTES, PAGE_ROUTES } from '@tmlmobilidade/consts';
import { buildParameterSummary, buildRuleSummary, computeSegmentTravelTimes, Dates, getMergedPath } from '@tmlmobilidade/dates';
import { getBaseGeoJsonFeatureCollection } from '@tmlmobilidade/geo';
import { type Stop } from '@tmlmobilidade/go-types-infrastructure';
import { EventReplacementRule, EventRestrictionRule, type LineNormalized, ManualRule, Path, Pattern, PopulatedPath, PopulatedPattern, ScheduleRule, StopsParameter, type UpdatePatternDto, UpdatePatternSchema } from '@tmlmobilidade/go-types-offer';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { type ApiResponse } from '@tmlmobilidade/go-types-shared';
import { generateRandomString } from '@tmlmobilidade/strings';
import { DetailContextStateTemplate, fetchApiData, keepUrlParams, type MapOverlayPatternShapeLineData, type MapOverlayPatternShapeLineDataProps, type MapOverlayPatternShapeStopsDataProps, useDetailState, type UseFormReturnType, useHandleAction, useMeContext, useToast, useTypicalForm } from '@tmlmobilidade/ui';
import { fetchData } from '@tmlmobilidade/utils';
import { type FeatureCollection, type Point } from 'geojson';
import { useRouter } from 'next/navigation';
import { createContext, type PropsWithChildren, useCallback, useContext, useMemo } from 'react';
import useSWR from 'swr';

/* * */

interface PatternDetailContextState {
	actions: DetailContextStateTemplate['actions'] & {
		addComment: (comment: string) => void
		addRule: (rule: ManualRule) => void
		deleteRule: (ruleId: string) => void
		duplicateRule: (rule: ManualRule) => void
		editRule: (rule: ManualRule) => void
		enrichPath: (path: Path[]) => Promise<PopulatedPath[]>
		mutate: () => Promise<ApiResponse<Pattern> | undefined>
		openRuleModal: (rule?: ManualRule) => void
		openRulesCalendarPreviewModal: () => void
		openStopsParameterModal: (rule?: StopsParameter) => void
	}
	data: {
		agency_id: string
		form: UseFormReturnType<UpdatePatternDto>
		id: string
		lineId: string
		mergedRules: ScheduleRule[]
		pattern: null | PopulatedPattern
		stopsParameterRules: StopsParameterExtended[]
		typologyData?: LineNormalized['typology_data']
	}
	flags: DetailContextStateTemplate['flags']
	geojson: {
		pattern_line: MapOverlayPatternShapeLineData | null
		pattern_stops: FeatureCollection<Point, MapOverlayPatternShapeStopsDataProps> | null
	}
}

/* * */

const PatternDetailContext = createContext<PatternDetailContextState | undefined>(undefined);

export function usePatternDetailContext() {
	const context = useContext(PatternDetailContext);
	if (!context) {
		throw new Error('usePatternDetailContext must be used within a PatternDetailContextProvider');
	}
	return context;
}

/* * */

export const PatternDetailContextProvider = ({ children, lineId, patternId }: PropsWithChildren<{ lineId: string, patternId: string }>) => {
	//

	//
	// A. Setup variables

	const router = useRouter();
	const meContext = useMeContext();
	const periodsContext = usePeriodsContext();
	const eventsContext = useEventsContext();

	//
	// B. Fetch data

	const { data: patternData, error: patternError, isLoading: patternLoading, mutate: patternMutate } = useSWR<ApiResponse<PopulatedPattern>>(API_ROUTES.offer.PATTERNS_DETAIL(patternId), {
		fetcher: async url => await fetchApiData<PopulatedPattern>({ url }),
	});

	const { data: lineData, mutate: lineMutate } = useSWR<ApiResponse<LineNormalized>>(API_ROUTES.offer.LINES_DETAIL(lineId), {
		fetcher: async url => await fetchApiData<LineNormalized>({ url }),
	});

	const typologyData = lineData?.data?.typology_data;

	//
	// C. Setup form

	const manualRules = useMemo(
		() => (patternData?.data?.rules ?? []).filter((r): r is ManualRule => r.kind === 'manual'),
		[patternData],
	);

	const derivedRules = useMemo(
		() => (patternData?.data?.rules ?? []).filter(r => r.kind === 'event_restriction' || r.kind === 'event_replacement') as (EventReplacementRule | EventRestrictionRule)[],
		[patternData],
	);

	const patternForForm = useMemo(
		() => (patternData ? { ...patternData.data, rules: manualRules } : patternData),
		[patternData, manualRules],
	);

	const { form } = useTypicalForm<UpdatePatternDto>(UpdatePatternSchema, patternForForm as UpdatePatternDto);

	//
	// C. Editable pattern data

	const editablePath = useMemo(
		() => (form.values.path ?? patternData?.data?.path ?? []) as PopulatedPath[],
		[form.values.path, patternData?.data?.path],
	);
	const editableShape = form.values.shape ?? patternData?.data?.shape;

	//
	// D. Transform editable data to GeoJSON

	const patternLineFC: MapOverlayPatternShapeLineData | null = useMemo(() => {
		const properties: MapOverlayPatternShapeLineDataProps = {
			color: typologyData?.color,
			id: patternData?.data?._id ?? patternId,
		};

		if (editableShape?.encoded_polyline) {
			return {
				encoded_polyline: editableShape.encoded_polyline,
				properties,
			};
		}

		if (!editableShape?.geojson?.geometry?.coordinates) return null;

		return {
			geometry: {
				coordinates: editableShape.geojson.geometry.coordinates,
				type: 'LineString' as const,
			},
			properties,
			type: 'Feature' as const,
		};
	}, [editableShape, typologyData?.color, patternData?.data?._id, patternId]);

	const patternStopsFC: FeatureCollection<Point, MapOverlayPatternShapeStopsDataProps> | null = useMemo(() => {
		const featureCollection = getBaseGeoJsonFeatureCollection<Point, MapOverlayPatternShapeStopsDataProps>();

		featureCollection.features = editablePath
			.filter(pathItem => pathItem.stop)
			.map((pathItem, index) => ({
				geometry: {
					coordinates: [
						pathItem.stop.longitude,
						pathItem.stop.latitude,
					],
					type: 'Point' as const,
				},
				properties: {
					id: String(pathItem.stop._id),
					name: pathItem.stop.name,
					sequence: index + 1,
				},
				type: 'Feature' as const,
			}));

		return featureCollection;
	}, [editablePath]);

	// rules used for UI + preview
	const rulesForUI = useMemo(
		() => {
			const allRules = [...(form.values.rules ?? []), ...derivedRules] as ScheduleRule[];
			const periods = periodsContext.data.raw || [];

			// Enhance each rule with generated name and short name
			return allRules.map((rule) => {
				const { long, short, tooltip } = buildRuleSummary(rule, { events: eventsContext.data.raw, periods });
				return { ...rule, name: long, shortName: short, tooltip };
			});
		},
		[eventsContext.data.raw, form.values.rules, derivedRules, periodsContext.data.raw],
	);

	// parameters used for UI + preview
	const parametersForUI = useMemo(() => {
		const allParameters = [...(form.values.parameters ?? [])] as StopsParameter[];
		const periods = periodsContext.data.raw || [];
		const basePath = editablePath;

		return allParameters.map((parameter) => {
			const { long, short } = buildParameterSummary(parameter, { periods });

			const mergedPath = getMergedPath(basePath, parameter.path || []);
			const parameterTravelTimes = computeSegmentTravelTimes(mergedPath);

			return {
				...parameter,
				name: long,
				shortName: short,
				travelTimes: parameterTravelTimes,
			};
		});
	}, [form.values.parameters, periodsContext.data.raw, editablePath]);

	//
	// E. Handle Schedule RULES actions

	const handleAddRule = useCallback((rule: ManualRule) => {
		const currentRules = (form.getValues().rules ?? []) as ManualRule[];
		const ruleWithId = { ...rule, _id: generateRandomString({ length: 5 }) };
		const newRules = [...currentRules, ruleWithId];

		form.setFieldValue('rules', newRules);
	}, [form]);

	const handleEditRule = useCallback((rule: ManualRule) => {
		if (!rule._id) {
			return;
		}
		const currentRules = (form.getValues().rules ?? []) as ManualRule[];
		const newRules = currentRules.map(r =>
			r._id === rule._id ? rule : r,
		);

		form.setFieldValue('rules', newRules);
	}, [form]);

	const handleDeleteRule = useCallback((ruleId: string) => {
		const currentRules = (form.getValues().rules ?? []) as ManualRule[];
		const newRules = currentRules.filter(r => r._id !== ruleId);

		form.setFieldValue('rules', newRules);
	}, [form]);

	const handleDuplicateRule = useCallback((rule: ManualRule) => {
		const currentRules = (form.getValues().rules ?? []) as ManualRule[];
		const manualRule = { ...rule } as ManualRule & { shortName?: string, tooltip?: string };
		delete manualRule.shortName;
		delete manualRule.tooltip;
		const duplicatedRule = { ...manualRule, _id: generateRandomString({ length: 5 }) };
		const newRules = [...currentRules, duplicatedRule];

		form.setFieldValue('rules', newRules);
	}, [form]);

	const handleOpenRuleModal = useCallback((rule?: ManualRule) => {
		const onSubmit = (validatedRule: ManualRule) => {
			if (rule?._id) {
				// Editing - preserve the _id
				handleEditRule({ ...validatedRule, _id: rule._id });
			} else {
				// Creating new
				handleAddRule(validatedRule);
			}
		};

		const onDelete = rule?._id ? () => handleDeleteRule(rule._id) : undefined;
		const onDuplicate = rule?._id ? (duplicatedRule: ManualRule) => handleDuplicateRule(duplicatedRule) : undefined;

		openCreateRuleModal(lineData?.data?.agency_id || '', onSubmit, rule, onDelete, onDuplicate);
	}, [handleAddRule, handleEditRule, handleDeleteRule, handleDuplicateRule, lineData?.data?.agency_id]);

	const handleOpenRulesCalendarPreviewModal = useCallback(() => {
		openRulesCalendarPreviewModal(
			lineData?.data?.agency_id || '',
			rulesForUI,
			patternData?.data?.code,
		);
	}, [lineData?.data?.agency_id, rulesForUI, patternData?.data?.code]);

	//
	// F. Handle Schedule RULES actions

	const handleAddStopParameter = useCallback((rule: StopsParameter) => {
		const currentRules = (form.getValues().parameters ?? []) as StopsParameter[];
		const ruleWithId = { ...rule, _id: generateRandomString({ length: 5 }) };
		const newRules = [...currentRules, ruleWithId];

		form.setFieldValue('parameters', newRules);
	}, [form]);

	const handleEditStopParameter = useCallback((rule: StopsParameter) => {
		if (!rule._id) {
			return;
		}
		const currentRules = (form.getValues().parameters ?? []) as StopsParameter[];
		const newRules = currentRules.map(r =>
			r._id === rule._id ? rule : r,
		);

		form.setFieldValue('parameters', newRules);
	}, [form]);

	const handleDeleteStopParameter = useCallback((ruleId: string) => {
		const currentRules = (form.getValues().parameters ?? []) as StopsParameter[];
		const newRules = currentRules.filter(r => r._id !== ruleId);

		form.setFieldValue('parameters', newRules);
	}, [form]);

	const handleOpenStopsParameterModal = useCallback((rule?: StopsParameter) => {
		const onSubmit = (validatedRule: StopsParameter) => {
			if (rule?._id) {
				// Editing - preserve the _id
				handleEditStopParameter({ ...validatedRule, _id: rule._id });
			} else {
				// Creating new
				handleAddStopParameter(validatedRule);
			}
		};

		const onDelete = rule?._id ? () => handleDeleteStopParameter(rule._id) : undefined;

		const defaultParameter = (form.getValues().parameters ?? []).find((p): p is StopsParameter => p.kind === 'default');
		openCreateParameterModal(lineData?.data?.agency_id || '', onSubmit, (form.getValues().path ?? patternData?.data?.path) as PopulatedPath[], rule, onDelete, defaultParameter);
	}, [lineData?.data?.agency_id, patternData?.data, handleEditStopParameter, handleAddStopParameter, handleDeleteStopParameter, form]);

	//
	// G. Handle comments actions

	const addComment = useCallback(async (comment: string) => {
		try {
			const commentToAdd = {
				created_at: Dates.now('Europe/Lisbon').unix_milliseconds,
				created_by: 'will-be-set-by-api',
				message: comment,
				type: 'note',
				updated_at: Dates.now('Europe/Lisbon').unix_milliseconds,
			};
			const res = await fetchData(API_ROUTES.offer.PATTERNS_DETAIL_COMMENT(patternId), 'POST', commentToAdd);

			if (res.error) {
				useToast.error({ message: res.error, title: 'Erro ao adicionar comentário' });
				return;
			}

			await patternMutate();
			useToast.success({ message: 'Comentário adicionado com sucesso.', title: 'Sucesso' });
		} catch (error) {
			useToast.error({ message: error.message, title: 'Erro ao adicionar comentário' });
		}
	}, [patternId, patternMutate]);

	// Used to fetch stops when we revert a path change from the history
	const enrichPath = useCallback(async (path: Path[]): Promise<PopulatedPath[]> => {
		const stopIds = [...new Set(path.map(p => p.stop_id))];
		const results = await Promise.all(
			stopIds.map(id => fetchApiData<Stop>({ url: API_ROUTES.offer.PATTERNS_STOPS_DETAIL(String(id)) })),
		);
		const stopsMap = new Map(
			results.flatMap(r => r.data ? [[r.data._id, r.data]] : []),
		);
		return path.map(p => ({ ...p, stop: stopsMap.get(p.stop_id) ?? null }));
	}, []);

	const { action: handleSave, isLoading: isSaving } = useHandleAction({
		fetchFn: async () => await fetchApiData<Pattern>({ body: form.getValues(), method: 'PUT', url: API_ROUTES.offer.PATTERNS_DETAIL(patternId) }),
		onSuccess: () => {
			form.resetDirty();
			void patternMutate();
			void lineMutate();
		},
	});

	const { action: handleDelete, isLoading: isDeleting } = useHandleAction({
		fetchFn: async () => await fetchApiData<Pattern>({ body: patternData, method: 'DELETE', url: API_ROUTES.offer.PATTERNS_DETAIL(patternId) }),
		onSuccess: () => {
			form.resetDirty();
			void lineMutate();
			router.push(keepUrlParams(PAGE_ROUTES.offer.LINES_LIST));
		},
	});

	const { action: handleLock, isLoading: isLocking } = useHandleAction({
		fetchFn: async () => await fetchApiData<Pattern>({ url: API_ROUTES.offer.PATTERNS_DETAIL_LOCK(patternId) }),
		onSuccess: () => {
			form.resetDirty();
			void patternMutate();
			void lineMutate();
		},
	});

	//
	// F. Setup permissions

	const permissions = meContext.actions.getScopePermissions({
		actions: PermissionCatalog.all.lines.actions,
		resource: {
			key: 'agency_ids',
			requireAll: false,
			value: lineData?.data?.agency_id ? [lineData.data.agency_id] : [],
		},
		scope: PermissionCatalog.all.lines.scope,
	});

	const { canDelete, canLock, canSave, isReadOnly } = useDetailState({
		hasError: !!patternError,
		isDeleted: null,
		isDeleting,
		isDirty: form.isDirty(),
		isLoading: patternLoading,
		isLocked: patternData?.data?.is_locked,
		isLocking,
		isSaving: isSaving,
		isValid: form.isValid(),
		permissions: {
			delete: permissions.delete,
			lock: permissions.lock,
			read: permissions.read,
			update: permissions.update,
		},
	});

	//
	// G. Define context value

	const contextValue: PatternDetailContextState = useMemo(() => ({
		actions: {
			addComment,
			addRule: handleAddRule,
			delete: handleDelete,
			deleteRule: handleDeleteRule,
			duplicateRule: handleDuplicateRule,
			editRule: handleEditRule,
			enrichPath,
			lock: handleLock,
			mutate: patternMutate,
			openRuleModal: handleOpenRuleModal,
			openRulesCalendarPreviewModal: handleOpenRulesCalendarPreviewModal,
			openStopsParameterModal: handleOpenStopsParameterModal,
			save: handleSave,
		},
		data: {
			agency_id: lineData?.data?.agency_id || '',
			form,
			id: patternId,
			lineId,
			mergedRules: rulesForUI,
			pattern: patternData?.data,
			stopsParameterRules: parametersForUI,
			typologyData,
		},
		flags: {
			canDelete,
			canLock,
			canSave,
			error: patternError,
			isDeleting,
			isLoading: patternLoading,
			isLocking,
			isReadOnly,
			isSaving: isSaving,
		},
		geojson: {
			pattern_line: patternLineFC,
			pattern_stops: patternStopsFC,
		},
	}), [addComment, handleAddRule, handleDelete, handleDeleteRule, handleEditRule, handleDuplicateRule, handleLock, patternMutate, handleOpenRuleModal, handleOpenRulesCalendarPreviewModal, handleOpenStopsParameterModal, handleSave, enrichPath, lineData?.data?.agency_id, form, patternId, lineId, rulesForUI, patternData?.data, parametersForUI, typologyData, canDelete, canLock, canSave, patternError, isDeleting, patternLoading, isLocking, isReadOnly, isSaving, patternLineFC, patternStopsFC]);

	//
	// H. Render components

	return (
		<PatternDetailContext.Provider value={contextValue}>
			{children}
		</PatternDetailContext.Provider>
	);

	//
};
