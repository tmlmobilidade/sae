/* * */

import { usePatternDetailContext } from '@/components/patterns/detail/PatternDetail.context';
import { PopulatedPath } from '@tmlmobilidade/go-types-offer';
import { MapOverlayPatternShape, type MapOverlayPatternShapeLineData, MapView, Section, useToast } from '@tmlmobilidade/ui';
import { useCallback, useMemo } from 'react';

import styles from './styles.module.css';

import { buildRoutePreviewModel } from '../../../../../utils/route-preview';
import { useStopsEditorContext } from '../ShapeEditor.context';
import { InitialStopSelector } from '../ShapeEditorInitialSelector';
import { StopsList } from '../ShapeEditorStopsList';

/* * */

export function ShapeEditorContent() {
	//

	//
	// A. Setup variables

	const patternDetailContext = usePatternDetailContext();
	const stopsEditorContext = useStopsEditorContext();

	const lineData = useMemo(() => {
		const legs = stopsEditorContext.data.routeData?.legs ?? stopsEditorContext.data.shape?.legs;
		const routePreviewLegSegments = new Map(
			buildRoutePreviewModel(
				stopsEditorContext.data.path as PopulatedPath[],
				stopsEditorContext.data.anchors,
			).legSegments.map(segment => [
				`${segment.leg_from_index}:${segment.leg_to_index}`,
				segment,
			]),
		);

		if (legs?.length) {
			if (legs.every(leg => leg.encoded_polyline)) {
				return {
					features: legs.map(leg => ({
						encoded_polyline: leg.encoded_polyline ?? '',
						properties: {
							color: patternDetailContext.data.typologyData?.color,
							from_index: leg.from_index,
							id: `${patternDetailContext.data.id}:${leg.from_index}-${leg.to_index}`,
							stop_from_index: routePreviewLegSegments.get(`${leg.from_index}:${leg.to_index}`)?.stop_from_index,
							stop_to_index: routePreviewLegSegments.get(`${leg.from_index}:${leg.to_index}`)?.stop_to_index,
							to_index: leg.to_index,
						},
					})),
					type: 'EncodedPolylineCollection' as const,
				} satisfies MapOverlayPatternShapeLineData;
			}

			return {
				features: legs.map(leg => ({
					geometry: {
						coordinates: leg.geometry,
						type: 'LineString' as const,
					},
					properties: {
						color: patternDetailContext.data.typologyData?.color,
						from_index: leg.from_index,
						id: `${patternDetailContext.data.id}:${leg.from_index}-${leg.to_index}`,
						stop_from_index: routePreviewLegSegments.get(`${leg.from_index}:${leg.to_index}`)?.stop_from_index,
						stop_to_index: routePreviewLegSegments.get(`${leg.from_index}:${leg.to_index}`)?.stop_to_index,
						to_index: leg.to_index,
					},
					type: 'Feature' as const,
				})),
				type: 'FeatureCollection' as const,
			};
		}

		return patternDetailContext.geojson.pattern_line;
	}, [
		stopsEditorContext.data.shape?.legs,
		patternDetailContext.data.id,
		patternDetailContext.data.typologyData?.color,
		patternDetailContext.geojson.pattern_line,
		stopsEditorContext.data.anchors,
		stopsEditorContext.data.path,
		stopsEditorContext.data.routeData,
	]);

	const stopsData = useMemo(() => ({
		features: (stopsEditorContext.data.path as PopulatedPath[])
			.filter(pathItem => pathItem.stop)
			.map((pathItem, index) => ({
				geometry: {
					coordinates: [pathItem.stop.longitude, pathItem.stop.latitude] as [number, number],
					type: 'Point' as const,
				},
				properties: {
					id: String(pathItem.stop._id),
					name: pathItem.stop.name,
					sequence: index + 1,
				},
				type: 'Feature' as const,
			})),
		type: 'FeatureCollection' as const,
	}), [stopsEditorContext.data.path]);

	//
	// B. Handle actions

	const handleAnchorDrop = async (anchor: {
		lat: number
		lon: number
		segment?: {
			from_index: number
			to_index: number
		}
	}) => {
		if (!anchor.segment) {
			useToast.error({
				message: 'Este shape ainda não está preparado para desvios. Recalcule primeiro o percurso.',
				title: 'Não foi possível adicionar desvio',
			});
			return;
		}

		const afterPathItem = stopsEditorContext.data.path[anchor.segment.from_index];
		const beforePathItem = stopsEditorContext.data.path[anchor.segment.to_index];

		if (!afterPathItem || !beforePathItem) {
			useToast.error({
				message: 'Não foi possível identificar o segmento entre paragens.',
				title: 'Erro ao adicionar desvio',
			});
			return;
		}

		await stopsEditorContext.actions.addShapeAnchor({
			after_stop_id: afterPathItem.stop_id,
			before_stop_id: beforePathItem.stop_id,
			lat: anchor.lat,
			lon: anchor.lon,
			type: 'via',
		});
	};

	const handleAnchorDragPreview = useCallback(async (
		anchor: { lat: number, lon: number, segment?: { from_index?: number, to_index?: number } },
		draggingAnchorId: null | string,
	) => {
		const { anchors, path } = stopsEditorContext.data;

		if (draggingAnchorId !== null) {
			// Moving an existing anchor — swap its position in the anchors array
			const nextAnchors = anchors.map(a =>
				a._id === draggingAnchorId ? { ...a, lat: anchor.lat, lon: anchor.lon } : a,
			);
			await stopsEditorContext.actions.previewRoute(path as PopulatedPath[], nextAnchors);
		} else if (anchor.segment?.from_index !== undefined && anchor.segment?.to_index !== undefined) {
			// Dropping a new anchor — build a temporary anchor for preview
			const afterPathItem = path[anchor.segment.from_index];
			const beforePathItem = path[anchor.segment.to_index];

			if (!afterPathItem || !beforePathItem) return;

			const tempAnchor = {
				_id: '__preview__',
				after_stop_id: afterPathItem.stop_id,
				before_stop_id: beforePathItem.stop_id,
				lat: anchor.lat,
				lon: anchor.lon,
				sequence: anchors.filter(a =>
					a.after_stop_id === afterPathItem.stop_id && a.before_stop_id === beforePathItem.stop_id,
				).length,
				type: 'via' as const,
			};

			await stopsEditorContext.actions.previewRoute(path as PopulatedPath[], [...anchors, tempAnchor]);
		}
	}, [stopsEditorContext.actions, stopsEditorContext.data]);

	//
	// C. Render components

	if (!stopsEditorContext.data.path.length) {
		return (
			<InitialStopSelector
				isLoading={stopsEditorContext.flags.isLoadingRoute}
				lineColor={patternDetailContext.data.typologyData?.color || undefined}
				lineData={patternDetailContext.geojson.pattern_line}
				onInitialize={(s1, s2) => void stopsEditorContext.actions.initializePath(s1, s2)}
			/>
		);
	}

	return (
		<div className={styles.container}>
			<Section width="30%">
				<StopsList />
			</Section>

			<div className={styles.mapWrapper}>
				<MapView id="shapeMapView">
					<MapOverlayPatternShape
						anchorsData={stopsEditorContext.data.anchors}
						enableAnchorPreview={stopsEditorContext.flags.isEditableShape}
						id="pattern-shape"
						lineColor={patternDetailContext.data.typologyData?.color || undefined}
						lineData={lineData}
						onAnchorDragPreview={(event, draggingId) => void handleAnchorDragPreview(event, draggingId)}
						onAnchorDrop={handleAnchorDrop}
						onAnchorMove={(anchorId, event) => void stopsEditorContext.actions.moveShapeAnchor(anchorId, event.lat, event.lon)}
						onAnchorRemove={anchorId => void stopsEditorContext.actions.removeShapeAnchor(anchorId)}
						stopsData={stopsData}
					/>
				</MapView>
			</div>
		</div>
	);
}
