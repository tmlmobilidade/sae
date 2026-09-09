import { AGENCY_IDS, getAgencyInfo } from '@/lib/agency-catalog';
import { type HubVehiclePosition } from '@tmlmobilidade/go-types-hub';
import { type DataDrivenPropertyValueSpecification } from 'maplibre-gl';

/* * */

export const VEHICLE_MAP_ICON_EXPRESSION = [
	'match',
	['to-string', ['get', 'agency_id']],
	...AGENCY_IDS.flatMap((agencyId) => {
		const agency = getAgencyInfo(agencyId);
		return agency ? [agencyId, agency.vehicleMapIcon] : [];
	}),
	'map-vehicle-cmet-bus',
] as DataDrivenPropertyValueSpecification<string>;

/* * */

export function isVehicleIncludedInMap(vehicle: HubVehiclePosition) {
	if (!getAgencyInfo(vehicle.agency_id)) return false;
	if (!vehicle.trip_id || !vehicle.route_id) return false;
	return vehicle.direction_id !== undefined && vehicle.direction_id !== null;
}
