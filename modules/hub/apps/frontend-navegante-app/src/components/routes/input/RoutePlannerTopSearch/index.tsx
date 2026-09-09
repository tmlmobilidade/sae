'use client';

import { RoutePlannerLocationSelector } from '@/components/routes/input/RoutePlannerLocationSelector';
import { useRoutePlannerContext } from '@/components/routes/RoutePlanner.context';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';
import { useTopSearchLabel } from '@/hooks/search/useTopSearchLabel';
import { IconSearch } from '@tabler/icons-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

/* * */

export function RoutePlannerTopSearch() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();
	const { setActiveBottomSheet } = useBottomSheet();
	const routePlannerContext = useRoutePlannerContext();
	const containerRef = useRef<HTMLDivElement>(null);
	const selectedEntityLabel = useTopSearchLabel();

	//
	// B. Transform data

	const hasRouteInputContext = !!routePlannerContext.data.origin && !!routePlannerContext.data.destination;
	const isNavigating = routePlannerContext.flags.is_navigating;
	const isPreviewDetail = routePlannerContext.data.view_mode === 'itinerary-detail' && !isNavigating;
	const isDestinationSearchWithRouteInput = routePlannerContext.data.view_mode === 'destination-search' && hasRouteInputContext;
	const isRouteInputView = ['itinerary-detail', 'results'].includes(routePlannerContext.data.view_mode) || isDestinationSearchWithRouteInput;
	const shouldShowRouteInput = !isNavigating && isRouteInputView;
	const searchLabel = isNavigating ? t('default:routes.RoutePlannerTopSearch.placeholder') : selectedEntityLabel || t('default:action-bar.ActionBar.search.label');
	const isRouteInputReadOnly = isPreviewDetail;

	//
	// C. Handle effects

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const element = containerRef.current;
		if (!element) return;

		const updateFloatingControlsTop = () => {
			const rect = element.getBoundingClientRect();
			document.documentElement.style.setProperty('--route-planner-floating-controls-top', `${Math.ceil(rect.bottom + 14)}px`);
		};

		updateFloatingControlsTop();

		const resizeObserver = new ResizeObserver(updateFloatingControlsTop);
		resizeObserver.observe(element);
		window.addEventListener('resize', updateFloatingControlsTop);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', updateFloatingControlsTop);
			document.documentElement.style.removeProperty('--route-planner-floating-controls-top');
		};
	}, [shouldShowRouteInput]);

	//
	// D. Handle actions

	const handleOriginClick = () => {
		routePlannerContext.actions.openLocationSearch('origin');
	};

	const handleDestinationClick = () => {
		routePlannerContext.actions.openLocationSearch('destination');
	};

	//
	// E. Render components

	return (
		<div ref={containerRef} className={styles.container}>
			{shouldShowRouteInput && (
				<div className={styles.routeInputWrapper}>
					<RoutePlannerLocationSelector
						destination={routePlannerContext.data.destination}
						onDestinationClick={handleDestinationClick}
						onOriginClick={handleOriginClick}
						onSwap={routePlannerContext.actions.swapLocations}
						origin={routePlannerContext.data.origin}
						readOnly={isRouteInputReadOnly}
					/>
				</div>
			)}

			{!shouldShowRouteInput && (
				<button className={styles.searchButton} onClick={() => setActiveBottomSheet({ view: 'search' })} type="button">
					<IconSearch className={styles.searchIcon} size={24} />
					<span className={styles.placeholder}>{searchLabel}</span>
				</button>
			)}
		</div>
	);

	//
}
