import { type StopExportData } from '@tmlmobilidade/go-types-downloads';
import { type Stop } from '@tmlmobilidade/go-types-infrastructure';

export type StopExportCsvData = Omit<StopExportData, 'flags'> & {
	municipality_name: null | string
};

/**
 * The ordered fields of the stop export CSV data.
 * The order is important because it determines the order of the fields in the CSV file.
 */
export const STOP_EXPORT_ORDERED_FIELDS = [
	// GENERAL
	'_id',
	'jurisdiction',
	'legacy_id',
	'legacy_ids',
	'lifecycle_status',
	'name',
	'new_name',
	'previous_go_id',
	'short_name',
	'tts_name',

	// LOCATION
	'district_id',
	'latitude',
	'locality_id',
	'longitude',
	'municipality_name',
	'municipality_id',
	'parish_id',

	// INFRASTRUCTURE
	'bench_status',
	'electricity_status',
	'pole_status',
	'road_type',

	// SHELTER
	'shelter_code',
	'shelter_frame_size',
	'shelter_installation_date',
	'shelter_maintainer',
	'shelter_make',
	'shelter_model',
	'shelter_status',

	// CHECKS
	'last_infrastructure_check',
	'last_infrastructure_maintenance',
	'last_schedules_check',
	'last_schedules_maintenance',

	// FACILITIES
	'connections',
	'facilities',

	// EQUIPMENTS
	'equipment',

	// HAS ...
	'has_bench',
	'has_mupi',
	'has_network_map',
	'has_schedules',
	'has_shelter',
	'has_stop_sign',
] as const satisfies ReadonlyArray<keyof StopExportCsvData>;

/* * */

interface ParseStopRow {
	_id?: null | number
	municipality_name: null | string
	stop: Stop
}

function toOrderedCsvData(source: StopExportCsvData): StopExportCsvData {
	const orderedEntries = STOP_EXPORT_ORDERED_FIELDS.map(field => [field, source[field]] as const);
	return Object.fromEntries(orderedEntries) as StopExportCsvData;
}

/* * */

export function parseStops(row: ParseStopRow): StopExportCsvData {
	const { _id, municipality_name: municipalityName, stop } = row;

	return toOrderedCsvData({
		_id: _id ?? stop._id,
		bench_status: stop.bench_status,
		connections: stop.connections,
		district_id: stop.district_id,
		electricity_status: stop.electricity_status,
		equipment: stop.equipment,
		facilities: stop.facilities,
		has_bench: stop.has_bench,
		has_mupi: stop.has_mupi,
		has_network_map: stop.has_network_map,
		has_schedules: stop.has_schedules,
		has_shelter: stop.has_shelter,
		has_stop_sign: stop.has_stop_sign,
		jurisdiction: stop.jurisdiction,
		last_infrastructure_check: stop.last_infrastructure_check,
		last_infrastructure_maintenance: stop.last_infrastructure_maintenance,
		last_schedules_check: stop.last_schedules_check,
		last_schedules_maintenance: stop.last_schedules_maintenance,
		latitude: stop.latitude,
		legacy_id: stop.legacy_id,
		legacy_ids: stop.legacy_ids,
		lifecycle_status: stop.lifecycle_status,
		locality_id: stop.locality_id,
		longitude: stop.longitude,
		municipality_id: stop.municipality_id,
		municipality_name: municipalityName ?? null,
		name: stop.name,
		new_name: stop.new_name,
		parish_id: stop.parish_id,
		pole_status: stop.pole_status,
		previous_go_id: stop.previous_go_id,
		road_type: stop.road_type,
		shelter_code: stop.shelter_code,
		shelter_frame_size: stop.shelter_frame_size,
		shelter_installation_date: stop.shelter_installation_date,
		shelter_maintainer: stop.shelter_maintainer,
		shelter_make: stop.shelter_make,
		shelter_model: stop.shelter_model,
		shelter_status: stop.shelter_status,
		short_name: stop.short_name,
		tts_name: stop.tts_name,
	});
}
