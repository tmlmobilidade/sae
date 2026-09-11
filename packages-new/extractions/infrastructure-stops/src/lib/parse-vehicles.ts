import { type Vehicle } from '@tmlmobilidade/types';

export type VehicleExportCsvData = Vehicle;

/**
 * The ordered fields of the vehicle export CSV data.
 * The order is important because it determines the order of the fields in the CSV file.
 */
export const VEHICLE_EXPORT_ORDERED_FIELDS = [
	'_id',
	'created_at',
	'created_by',
	'is_locked',
	'updated_at',
	'updated_by',
	'agency_id',
	'license_plate',
	'make',
	'model',
	'owner',
	'registration_date',
	'start_date',
	'vehicle_id',
	'available_seats',
	'available_standing',
	'emission',
	'propulsion',
	'typology',
	'bicycles',
	'climatization',
	'consumption_meter',
	'contactless',
	'corridor',
	'external_sound',
	'folding_system',
	'front_display',
	'internal_sound',
	'kneeling',
	'lowered_floor',
	'onboard_monitor',
	'passenger_counting',
	'ramp',
	'rear_display',
	'side_display',
	'static_information',
	'wheelchair',
] as const satisfies ReadonlyArray<keyof VehicleExportCsvData>;

/* * */

interface ParseVehicleRow {
	vehicle: Vehicle
}

function toOrderedCsvData(source: VehicleExportCsvData): VehicleExportCsvData {
	const orderedEntries = VEHICLE_EXPORT_ORDERED_FIELDS.map(field => [field, source[field]] as const);
	return Object.fromEntries(orderedEntries) as VehicleExportCsvData;
}

/* * */

export function parseVehicles(row: ParseVehicleRow): VehicleExportCsvData {
	const { vehicle } = row;

	return toOrderedCsvData(vehicle);
}
