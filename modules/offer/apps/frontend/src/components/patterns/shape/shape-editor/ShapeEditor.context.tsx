'use client';

/* * */

import { usePatternDetailContext } from '@/components/patterns/detail/PatternDetail.context';
import { buildRoutePreviewModel, buildRoutePreviewRecalculationPlan, composeRoutePreviewResponse, mergeRoutePreviewRange, type RoutePreviewAnchor, type RoutePreviewPoint, type RoutePreviewResponse } from '@/utils/route-preview';
import { API_ROUTES } from '@tmlmobilidade/consts';
import { type Stop } from '@tmlmobilidade/go-types-infrastructure';
import { Path, PopulatedPath, Shape } from '@tmlmobilidade/go-types-offer';
import { generateRandomString } from '@tmlmobilidade/strings';
import { useToast } from '@tmlmobilidade/ui';
import { fetchData } from '@tmlmobilidade/utils';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/* * */

type ShapeAnchor = RoutePreviewAnchor;

interface HistoryEntry {
	path: PopulatedPath[]
	shape: Shape | undefined
}

interface StopsEditorContextState {
	actions: {
		addShapeAnchor: (anchor: Omit<ShapeAnchor, '_id' | 'sequence'>) => Promise<void>
		addStop: (stop: Stop, index: number) => Promise<void>
		appendStop: (stop: Stop) => Promise<void>
		cancel: () => void
		convertShapeToEditable: () => Promise<void>
		dismissMigrationWarning: () => void
		initializePath: (firstStop: Stop, secondStop: Stop) => Promise<void>
		moveShapeAnchor: (anchorId: string, lat: number, lon: number) => Promise<void>
		prependStop: (stop: Stop) => Promise<void>
		previewRoute: (path: Path[], anchors?: ShapeAnchor[]) => Promise<void>
		recomputeRoute: (path: Path[], anchors?: ShapeAnchor[]) => Promise<void>
		redo: () => void
		removeShapeAnchor: (anchorId: string) => Promise<void>
		removeStop: (index: number) => Promise<void>
		reorderStops: (path: Path[]) => Promise<void>
		revertPath: () => void
		submit: () => void
		undo: () => void
		updateStop: (index: number, values: Partial<Pick<Path, 'allow_drop_off' | 'allow_pickup' | 'timepoint'>>) => void
	}
	data: {
		anchors: ShapeAnchor[]
		hasUnsavedChanges: boolean
		path: Path[]
		routeData: null | RoutePreviewResponse
		shape: Shape | undefined
	}
	flags: {
		canRedo: boolean
		canUndo: boolean
		isEditableShape: boolean
		isLoadingRoute: boolean
		migrationWarningVisible: boolean
		needsMigration: boolean
	}
}

/* * */

const StopsEditorContext = createContext<StopsEditorContextState | undefined>(undefined);

export function useStopsEditorContext() {
	const context = useContext(StopsEditorContext);

	if (!context) {
		throw new Error('useStopsEditorContext must be used within StopsEditorContextProvider');
	}

	return context;
}

/* * */

function createPathItemFromStop(stop: Stop): PopulatedPath {
	return {
		_id: generateRandomString({ length: 5 }),
		allow_drop_off: true,
		allow_pickup: true,
		distance_delta: 0,
		stop,
		stop_id: stop._id,
		timepoint: true,
		// zones: stop.zone_ids ?? [],
	};
}

function applyRouteToPath(path: PopulatedPath[], routeData: RoutePreviewResponse, points: RoutePreviewPoint[]): PopulatedPath[] {
	const breakIndices = points
		.map((p, i) => (p.type === 'break' ? i : -1))
		.filter(i => i !== -1);

	return path.map((pathItem, index) => {
		if (index === 0) {
			return {
				...pathItem,
				distance_delta: 0,
			};
		}

		const fromBreakIdx = breakIndices[index - 1];
		const toBreakIdx = breakIndices[index];

		const distance = routeData.legs
			.filter(leg => leg.from_index >= fromBreakIdx && leg.to_index <= toBreakIdx)
			.reduce((sum, leg) => sum + leg.distance, 0);

		return {
			...pathItem,
			distance_delta: Math.round(distance),
		};
	});
}

async function requestRoutePreview(points: RoutePreviewPoint[], signal?: AbortSignal) {
	return fetchData<RoutePreviewResponse>(
		API_ROUTES.offer.SHAPES_ROUTE_PREVIEW,
		'POST',
		{
			costing: 'bus',
			costing_options: {
				bus: {
					use_ferry: 0,
				},
			},
			points: points.map(point => ({
				lat: point.lat,
				lon: point.lon,
				type: point.type,
			})),
		},
		{},
		signal ? { signal } : {},
		signal ? 0 : 3,
	);
}

export function StopsEditorContextProvider({ children, onClose }: PropsWithChildren<{ onClose: () => void }>) {
	const patternDetailContext = usePatternDetailContext();
	const [routeData, setRouteData] = useState<null | RoutePreviewResponse>(null);
	const [isLoadingRoute, setIsLoadingRoute] = useState(false);

	// Stable ref so pushToHistory can sync parameters without stale closures
	const formRef = useRef(patternDetailContext.data.form);
	formRef.current = patternDetailContext.data.form;

	// Local intermediate state — only written back to the pattern form on submit
	const [initialPath] = useState<PopulatedPath[]>(() => {
		const populatedPath = patternDetailContext.data.pattern?.path ?? [];
		const path = patternDetailContext.data.form.values.path ?? populatedPath;
		const stopsById = new Map(populatedPath.map(pathItem => [pathItem.stop_id, pathItem.stop]));

		return path.map(pathItem => ({
			...pathItem,
			stop: (pathItem as Partial<PopulatedPath>).stop ?? stopsById.get(pathItem.stop_id) ?? null,
		}));
	});
	const [initialShape] = useState<Shape | undefined>(() =>
		patternDetailContext.data.form.values.shape,
	);

	const [localPath, setLocalPath] = useState<PopulatedPath[]>(initialPath);
	const [localShape, setLocalShape] = useState<Shape | undefined>(initialShape);

	// Keep a ref so recomputeRoute can read the latest shape without stale closures
	const localShapeRef = useRef<Shape | undefined>(initialShape);
	localShapeRef.current = localShape;
	const previewAbortControllerRef = useRef<AbortController | null>(null);

	useEffect(() => () => previewAbortControllerRef.current?.abort(), []);

	// History stack — stored in refs to avoid re-renders on push; a small state
	// object is used only to make canUndo / canRedo reactive.
	const historyRef = useRef<HistoryEntry[]>([{ path: initialPath, shape: initialShape }]);
	const historyIndexRef = useRef(0);
	const [historyMeta, setHistoryMeta] = useState({ index: 0, length: 1 });

	const canUndo = historyMeta.index > 0;
	const canRedo = historyMeta.index < historyMeta.length - 1;

	const pushToHistory = useCallback((newPath: PopulatedPath[], newShape: Shape | undefined) => {
		const newStack = historyRef.current.slice(0, historyIndexRef.current + 1);
		newStack.push({ path: newPath, shape: newShape });
		historyRef.current = newStack;
		historyIndexRef.current = newStack.length - 1;
		setLocalPath(newPath);
		setLocalShape(newShape);
		setHistoryMeta({ index: historyIndexRef.current, length: newStack.length });

		// Eagerly sync parameters whenever the path changes.
		// Match by path item _id so circular lines with duplicate stop_ids are handled correctly.
		const form = formRef.current;
		const currentParameters = form.getValues().parameters ?? [];
		// Use the history entry we just replaced as the "previous path" — the form's path
		// is only written on submit and would be stale for repeated edits.
		const previousPath = newStack[newStack.length - 2]?.path ?? [];
		const updatedParameters = currentParameters.map((parameter) => {
			const paramByPathId = new Map(
				parameter.path.map((p, i) => [previousPath[i]?._id, p] as const),
			);
			return {
				...parameter,
				path: newPath.map(pathItem => (
					paramByPathId.get(pathItem._id) ?? { avg_speed: 0, dwell_time: 30, stop_id: pathItem.stop_id }
				)),
			};
		});
		form.setFieldValue('parameters', updatedParameters);
	}, []);

	const path = localPath;

	const anchors = useMemo(() => localShape?.anchors ?? [], [localShape]);

	const isEditableShape = localShape !== undefined;

	// A shape is "unmigrated" when imported from GTFS (has geometry) but has never
	// been processed by Valhalla (no legs). No shape at all = blank slate, fully editable.
	const needsMigration = localShape !== undefined && !(localShape.legs?.length);
	const needsMigrationRef = useRef(false);
	needsMigrationRef.current = needsMigration;

	const [migrationWarningVisible, setMigrationWarningVisible] = useState(false);

	const dismissMigrationWarning = useCallback(() => {
		setMigrationWarningVisible(false);
	}, []);

	const hasUnsavedChanges = useMemo(() =>
		JSON.stringify(localPath) !== JSON.stringify(initialPath),
	[localPath, initialPath]);

	const recomputeRoute = useCallback(async (nextPath: PopulatedPath[], nextAnchors: ShapeAnchor[] = anchors) => {
		try {
			previewAbortControllerRef.current?.abort();
			previewAbortControllerRef.current = null;
			setIsLoadingRoute(true);

			const previousPoints = buildRoutePreviewModel(path, anchors).points;
			const points = buildRoutePreviewModel(nextPath, nextAnchors).points;
			const previousLegs = localShapeRef.current?.legs ?? [];
			const plan = buildRoutePreviewRecalculationPlan(previousPoints, points, previousLegs);
			const rangeResults = await Promise.all(plan.ranges.map(async range => ({
				range,
				response: await requestRoutePreview(points.slice(range.from_index, range.to_index + 1)),
			})));

			for (const { range, response } of rangeResults) {
				if (!response.isOk) {
					useToast.error({
						message: response.error,
						title: 'Erro ao recalcular percurso',
					});
					return;
				}

				mergeRoutePreviewRange(plan.legs, range, response.data.legs);
			}

			const nextRouteData = composeRoutePreviewResponse(plan.legs);
			const updatedPath = applyRouteToPath(nextPath, nextRouteData, points);

			const updatedShape: Shape = {
				...(localShapeRef.current ?? {}),
				anchors: nextAnchors,
				encoded_polyline: nextRouteData.encoded_polyline,
				extension: Math.round(nextRouteData.distance),
				geojson: nextRouteData.geojson,
				legs: nextRouteData.legs,
			};

			pushToHistory(updatedPath, updatedShape);
			setRouteData(nextRouteData);
		} catch (error) {
			useToast.error({
				message: error instanceof Error ? error.message : 'Erro desconhecido',
				title: 'Erro ao recalcular percurso',
			});
		} finally {
			setIsLoadingRoute(false);
		}
	}, [anchors, path, pushToHistory]);

	const previewRoute = useCallback(async (nextPath: PopulatedPath[], nextAnchors: ShapeAnchor[] = anchors) => {
		previewAbortControllerRef.current?.abort();
		const abortController = new AbortController();
		previewAbortControllerRef.current = abortController;

		try {
			const previousPoints = buildRoutePreviewModel(path, anchors).points;
			const points = buildRoutePreviewModel(nextPath, nextAnchors).points;
			const previousLegs = localShapeRef.current?.legs ?? [];
			const plan = buildRoutePreviewRecalculationPlan(previousPoints, points, previousLegs);
			const rangeResults = await Promise.all(plan.ranges.map(async range => ({
				range,
				response: await requestRoutePreview(
					points.slice(range.from_index, range.to_index + 1),
					abortController.signal,
				),
			})));

			if (abortController.signal.aborted || previewAbortControllerRef.current !== abortController) return;

			for (const { range, response } of rangeResults) {
				if (!response.isOk) return;
				mergeRoutePreviewRange(plan.legs, range, response.data.legs);
			}

			setRouteData(composeRoutePreviewResponse(plan.legs));
		} catch {
			// Silent — preview failures are non-critical
		} finally {
			if (previewAbortControllerRef.current === abortController) {
				previewAbortControllerRef.current = null;
			}
		}
	}, [anchors, path]);

	const convertShapeToEditable = useCallback(async () => {
		setMigrationWarningVisible(false);
		await recomputeRoute(path, []);
	}, [path, recomputeRoute]);

	const addShapeAnchor = useCallback(async (anchor: Omit<ShapeAnchor, '_id' | 'sequence'>) => {
		if (needsMigrationRef.current) {
			setMigrationWarningVisible(true);
			return;
		}
		const segmentAnchorsCount = anchors.filter((existingAnchor) => {
			return existingAnchor.after_stop_id === anchor.after_stop_id && existingAnchor.before_stop_id === anchor.before_stop_id;
		}).length;

		const nextAnchors: ShapeAnchor[] = [
			...anchors,
			{
				...anchor,
				_id: generateRandomString({ length: 5 }),
				sequence: segmentAnchorsCount,
			},
		];

		await recomputeRoute(path, nextAnchors);
	}, [anchors, path, recomputeRoute]);

	const addStop = useCallback(async (stop: Stop, index: number) => {
		if (needsMigrationRef.current) {
			setMigrationWarningVisible(true);
			return;
		}
		const nextPath = [...path];
		nextPath.splice(index, 0, createPathItemFromStop(stop));

		if (nextPath.length < 2) {
			pushToHistory(nextPath, localShape);
			return;
		}

		await recomputeRoute(nextPath, anchors);
	}, [anchors, localShape, path, pushToHistory, recomputeRoute]);

	const initializePath = useCallback(async (firstStop: Stop, secondStop: Stop) => {
		const nextPath = [createPathItemFromStop(firstStop), createPathItemFromStop(secondStop)];
		await recomputeRoute(nextPath, []);
	}, [recomputeRoute]);

	const prependStop = useCallback(async (stop: Stop) => {
		await addStop(stop, 0);
	}, [addStop]);

	const appendStop = useCallback(async (stop: Stop) => {
		await addStop(stop, path.length);
	}, [addStop, path.length]);

	const removeStop = useCallback(async (index: number) => {
		if (needsMigrationRef.current) {
			setMigrationWarningVisible(true);
			return;
		}
		const nextPath = path.filter((_, pathIndex) => pathIndex !== index);
		const removedPathItem = path[index];

		const nextAnchors = anchors.filter((anchor) => {
			return anchor.after_stop_id !== removedPathItem?.stop_id && anchor.before_stop_id !== removedPathItem?.stop_id;
		});

		if (nextPath.length < 2) {
			pushToHistory(nextPath, undefined);
			return;
		}

		await recomputeRoute(nextPath, nextAnchors);
	}, [anchors, path, pushToHistory, recomputeRoute]);

	const reorderStops = useCallback(async (nextPath: PopulatedPath[]) => {
		if (needsMigrationRef.current) {
			setMigrationWarningVisible(true);
			return;
		}
		const nextStopIds = new Set(nextPath.map(pathItem => pathItem.stop_id));

		const nextAnchors = anchors.filter((anchor) => {
			return nextStopIds.has(anchor.after_stop_id) && nextStopIds.has(anchor.before_stop_id);
		});

		setLocalPath(nextPath);
		await recomputeRoute(nextPath, nextAnchors);
	}, [anchors, recomputeRoute]);

	const removeShapeAnchor = useCallback(async (anchorId: string) => {
		if (needsMigrationRef.current) {
			setMigrationWarningVisible(true);
			return;
		}
		const nextAnchors = anchors.filter(a => a._id !== anchorId);
		await recomputeRoute(path, nextAnchors);
	}, [anchors, path, recomputeRoute]);

	const moveShapeAnchor = useCallback(async (anchorId: string, lat: number, lon: number) => {
		if (needsMigrationRef.current) {
			setMigrationWarningVisible(true);
			return;
		}
		const nextAnchors = anchors.map(a => a._id === anchorId ? { ...a, lat, lon } : a);
		await recomputeRoute(path, nextAnchors);
	}, [anchors, path, recomputeRoute]);

	const undo = useCallback(() => {
		if (historyIndexRef.current <= 0) return;
		historyIndexRef.current--;
		const entry = historyRef.current[historyIndexRef.current];
		setLocalPath(entry.path);
		setLocalShape(entry.shape);
		setRouteData(null);
		setHistoryMeta({ index: historyIndexRef.current, length: historyRef.current.length });
	}, []);

	const redo = useCallback(() => {
		if (historyIndexRef.current >= historyRef.current.length - 1) return;
		historyIndexRef.current++;
		const entry = historyRef.current[historyIndexRef.current];
		setLocalPath(entry.path);
		setLocalShape(entry.shape);
		setRouteData(null);
		setHistoryMeta({ index: historyIndexRef.current, length: historyRef.current.length });
	}, []);

	const updateStop = useCallback((index: number, values: Partial<Pick<Path, 'allow_drop_off' | 'allow_pickup' | 'timepoint'>>) => {
		const nextPath = path.map((pathItem, pathIndex) => {
			if (pathIndex !== index) return pathItem;
			return { ...pathItem, ...values };
		});

		pushToHistory(nextPath, localShape);
	}, [localShape, path, pushToHistory]);

	const revertPath = useCallback(() => {
		pushToHistory(initialPath, initialShape);
		setRouteData(null);
	}, [initialPath, initialShape, pushToHistory]);

	const submit = useCallback(() => {
		patternDetailContext.data.form.setFieldValue('path', localPath);
		patternDetailContext.data.form.setFieldValue('shape', localShape);
		onClose();
	}, [localPath, localShape, onClose, patternDetailContext.data.form]);

	const cancel = useCallback(() => {
		onClose();
	}, [onClose]);

	const contextValue: StopsEditorContextState = useMemo(() => ({
		actions: {
			addShapeAnchor,
			addStop,
			appendStop,
			cancel,
			convertShapeToEditable,
			dismissMigrationWarning,
			initializePath,
			moveShapeAnchor,
			prependStop,
			previewRoute,
			recomputeRoute,
			redo,
			removeShapeAnchor,
			removeStop,
			reorderStops,
			revertPath,
			submit,
			undo,
			updateStop,
		},
		data: {
			anchors,
			hasUnsavedChanges,
			path,
			routeData,
			shape: localShape,
		},
		flags: {
			canRedo,
			canUndo,
			isEditableShape,
			isLoadingRoute,
			migrationWarningVisible,
			needsMigration,
		},
	}), [addShapeAnchor, addStop, appendStop, cancel, convertShapeToEditable, dismissMigrationWarning, initializePath, moveShapeAnchor, previewRoute, prependStop, recomputeRoute, redo, removeShapeAnchor, removeStop, reorderStops, revertPath, submit, undo, updateStop, anchors, canRedo, canUndo, hasUnsavedChanges, migrationWarningVisible, needsMigration, path, routeData, localShape, isEditableShape, isLoadingRoute]);

	return (
		<StopsEditorContext.Provider value={contextValue}>
			{children}
		</StopsEditorContext.Provider>
	);
}
