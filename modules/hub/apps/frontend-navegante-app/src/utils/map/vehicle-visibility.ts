import { type HubVehiclePosition } from '@tmlmobilidade/go-types-hub';

/* * */

const ALLOWED_VEHICLE_AGENCY_IDS = new Set([
	'7NTB1', // Fertagus
	'A2L1N', // Alsa (CM)
	'A3H3M', // TCB
	'BNA17', // Rodoviária de Lisboa (CM)
	'HF16N', // MobiCascais
	'IA2N9', // Metro de Lisboa
	'IA9T6', // Carris
	'KB1F6', // Metro Transportes do Sul
	'LA77N', // Viação Alvorada (CM)
	'LTP61', // Transtejo
	'N18KL', // Comboios de Portugal
	'YA15B', // TST (CM)
]);

/* * */

export function isVehicleIncludedInMap(vehicle: HubVehiclePosition) {
	if (!ALLOWED_VEHICLE_AGENCY_IDS.has(vehicle.agency_id)) return false;
	if (!vehicle.trip_id || !vehicle.route_id) return false;
	return vehicle.direction_id !== undefined && vehicle.direction_id !== null;
}
