'use client';

import { useLinesData } from '@/components/lines/use-lines-data';
import { MapViewOverlayStopsInteractiveLayerId } from '@/components/map/MapViewOverlayStops';
import { useMapContext } from '@/contexts/Map.context';
import { type HubStop } from '@tmlmobilidade/go-types-hub';
import { useDebouncedCallback } from '@tmlmobilidade/ui';
import { Marker } from '@vis.gl/react-maplibre';
import { useState } from 'react';

import styles from './styles.module.css';

/* * */

const LINE_BADGE_MIN_ZOOM = 16;

/* * */

interface StopLineBadge {
	_id: string
	color: string
	short_name: string
	text_color: string
}

interface StopLineBadgeGroup {
	badges: StopLineBadge[]
	latitude: number
	longitude: number
	stop_id: string
}

interface MapViewOverlayStopLineBadgesProps {
	limit?: number
	visible?: boolean
}

/* * */

export function MapViewOverlayStopLineBadges({ limit = 4, visible }: MapViewOverlayStopLineBadgesProps) {
	//

	//
	// A. Setup variables

	const mapContext = useMapContext();
	const { data: lines } = useLinesData();

	const [visibleBadges, setVisibleBadges] = useState<StopLineBadgeGroup[]>([]);

	//
	// B. Transform data

	const updateVisibleBadges = useDebouncedCallback(() => {
		// Skip if map is not ready
		if (!mapContext.data.map) return [];
		// If zoom is less than the minimum zoom, skip
		if (mapContext.data.map.getZoom() < LINE_BADGE_MIN_ZOOM) {
			setVisibleBadges([]);
			return;
		}
		// Get rendered features for the stops interactive layer
		const stopsInViewport = mapContext.data.map.queryRenderedFeatures({
			layers: [MapViewOverlayStopsInteractiveLayerId],
		});
		// For each stop in viewport, get associated line data
		// and create a badge group, sorting by short name
		const badgeGroups: StopLineBadgeGroup[] = [];
		stopsInViewport.forEach((stopFeature) => {
			const lineIds = JSON.parse(stopFeature.properties.line_ids);
			const properties = stopFeature.properties as HubStop;
			const badges: StopLineBadge[] = [];
			lineIds.forEach((lineId: string) => {
				const lineData = lines.find(line => line._id === lineId);
				if (!lineData) return;
				badges.push({
					_id: `${String(stopFeature.properties._id)}-${lineId}`,
					color: lineData.color,
					short_name: lineData.short_name,
					text_color: lineData.text_color,
				});
			});
			badgeGroups.push({
				badges: badges.sort((a, b) => a.short_name.localeCompare(b.short_name, undefined, { numeric: true })),
				latitude: properties.latitude,
				longitude: properties.longitude,
				stop_id: String(properties._id),
			});
		});
		setVisibleBadges(badgeGroups);
	}, 500);

	//
	// C. Handle actions

	mapContext.data.map?.on('moveend', updateVisibleBadges);
	mapContext.data.map?.on('rotate', updateVisibleBadges);
	mapContext.data.map?.on('pitch', updateVisibleBadges);
	mapContext.data.map?.on('zoomend', updateVisibleBadges);

	//
	// D. Render components

	if (!visible) return null;

	return visibleBadges.map(badgeGroup => (
		<Marker
			key={badgeGroup.stop_id}
			anchor="left"
			className={styles.badgeGroup}
			latitude={badgeGroup.latitude}
			longitude={badgeGroup.longitude}
			pitchAlignment="viewport"
			rotationAlignment="viewport"
		>
			{badgeGroup.badges.slice(0, limit).map(badge => (
				<div
					key={badge._id}
					className={styles.badge}
					style={{ backgroundColor: badge.color, color: badge.text_color }}
				>
					{badge.short_name}
				</div>
			))}
			{badgeGroup.badges.length > limit && (
				<div className={styles.more}>
					+{badgeGroup.badges.length - limit}
				</div>
			)}
		</Marker>
	));
}
