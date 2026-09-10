'use client';

import { useRoutePlannerContext } from '@/components/routes/RoutePlanner.context';
import { MAP_BOTTOM_SHEET_INITIAL_SNAP, MAP_BOTTOM_SHEET_SNAP_POINTS } from '@/constants/bottom-sheet';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';

/* * */

export type MapFloatingControlsLayoutKind = 'above-sheet' | 'default' | 'hidden';

export interface MapFloatingControlsLayout {
	// Pixel offset (not dvh/vh) so it matches exactly how react-modal-sheet itself measures the
	// sheet's height (via the container's real DOM height, off `window.innerHeight`). Mixing
	// `dvh` here previously caused the sheet's visible edge and this offset to drift apart on
	// mobile browsers with a dynamic viewport (address bar show/hide), hiding controls behind it.
	bottomOffsetPx: number
	layout: MapFloatingControlsLayoutKind
}

/* * */

// The live trip bar is 60px tall and sits 12px above the viewport's safe-area edge.
const ROUTE_PLANNER_LIVE_BAR_OFFSET_PX = 72;

/* * */

export function useMapFloatingControlsLayout(): MapFloatingControlsLayout {
	//

	//
	// A. Setup variables

	const { activeBottomSheet, activeBottomSheetSnap } = useBottomSheet();
	const routePlannerContext = useRoutePlannerContext();
	const compactSnapPoint = MAP_BOTTOM_SHEET_SNAP_POINTS[MAP_BOTTOM_SHEET_INITIAL_SNAP];
	const viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight;

	//
	// B. Transform data

	if (!activeBottomSheet) {
		if (routePlannerContext.flags.is_navigating) {
			return {
				bottomOffsetPx: ROUTE_PLANNER_LIVE_BAR_OFFSET_PX,
				layout: 'above-sheet',
			};
		}

		return { bottomOffsetPx: 0, layout: 'default' };
	}

	const isRouteSheet = activeBottomSheet.view === 'routes';
	const isRouteSearch = isRouteSheet && routePlannerContext.data.view_mode === 'destination-search';
	const isMapAwareDetailSheet = activeBottomSheet.view === 'lines-detail' || activeBottomSheet.view === 'stops-detail';
	const isMapAwareSheet = isMapAwareDetailSheet || (isRouteSheet && !isRouteSearch);

	if (!isMapAwareSheet) return { bottomOffsetPx: 0, layout: 'hidden' };

	// Use the sheet's actual current snap fraction (rather than fixed buckets) so the
	// floating controls line up correctly for every map-aware sheet and snap-points array.
	const snapPoint = activeBottomSheetSnap.snapPoint ?? compactSnapPoint;
	if (snapPoint >= 0.9) return { bottomOffsetPx: 0, layout: 'hidden' };

	return { bottomOffsetPx: Math.round(snapPoint * viewportHeight), layout: 'above-sheet' };

	//
}
