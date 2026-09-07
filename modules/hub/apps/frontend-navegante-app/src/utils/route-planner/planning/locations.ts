import { type RoutePlannerLocation } from '@/types/route-planner/models';
import { type HubStop } from '@tmlmobilidade/go-types-hub';

/* * */

interface MapHubStopToRoutePlannerLocationOptions {
	ensureGtfsId?: boolean
}

interface CreateRoutePlannerCurrentLocationParams {
	detail: string
	label: string
	latitude: number | undefined
	longitude: number | undefined
}

/* * */

export function createRoutePlannerCurrentLocation(params: CreateRoutePlannerCurrentLocationParams): null | RoutePlannerLocation {
	if (!Number.isFinite(params.latitude) || !Number.isFinite(params.longitude)) return null;

	return {
		detail: params.detail,
		label: params.label,
		lat: Number(params.latitude.toFixed(6)),
		lon: Number(params.longitude.toFixed(6)),
		type: 'PLACE',
	};
}

/* * */

export function mapHubStopToRoutePlannerLocation(stop: HubStop, options?: MapHubStopToRoutePlannerLocationOptions): RoutePlannerLocation {
	const stopId = String(stop._id);

	return {
		detail: [stop.locality_name, stop.municipality_name].filter(Boolean).join(' | '),
		id: options?.ensureGtfsId ? `GTFS_${stopId.replace(/^GTFS_/, '')}` : stopId,
		label: stop.name,
		lat: stop.latitude,
		lon: stop.longitude,
		type: 'STOP',
	};
}
