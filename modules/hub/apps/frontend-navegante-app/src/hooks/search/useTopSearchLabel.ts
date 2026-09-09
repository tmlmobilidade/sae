'use client';

import { useAlertsData } from '@/components/alerts/use-alerts-data';
import { useLinesData } from '@/components/lines/use-lines-data';
import { useRoutePlannerContext } from '@/components/routes/RoutePlanner.context';
import { useStopsData } from '@/components/stops/use-stops-data';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';
import { useMemo } from 'react';

/* * */

export function useTopSearchLabel(): null | string {
	//

	//
	// A. Setup variables

	const { data: alerts } = useAlertsData();
	const { data: lines } = useLinesData();
	const { data: stops } = useStopsData();
	const { activeBottomSheet } = useBottomSheet();
	const routePlannerContext = useRoutePlannerContext();

	//
	// B. Transform data

	return useMemo(() => {
		const entityId = activeBottomSheet?.entityId;

		if (activeBottomSheet?.view === 'lines-detail' && entityId) {
			return lines.find(line => line._id === entityId)?.short_name ?? null;
		}

		if (activeBottomSheet?.view === 'stops-detail' && entityId) {
			return stops.find(stop => String(stop._id) === entityId)?.name ?? null;
		}

		if (activeBottomSheet?.view === 'alerts-detail' && entityId) {
			return alerts.find(alert => alert._id === entityId)?.title ?? null;
		}

		if (activeBottomSheet?.view === 'vehicles-detail' && entityId) {
			return entityId;
		}

		if (activeBottomSheet?.view === 'routes' && routePlannerContext.data.view_mode === 'place-detail') {
			return routePlannerContext.data.destination?.label ?? null;
		}

		return null;
	}, [activeBottomSheet, alerts, lines, routePlannerContext.data.destination?.label, routePlannerContext.data.view_mode, stops]);

	//
}
