/* eslint-disable perfectionist/sort-objects */

interface AgencyCatalogEntry {
	fullName: string
	logoSlug: string
	mapOperatorId: string
	shortName: string
	vehicleMapIcon: string
}

interface AgencyGroupCatalogEntry {
	fullName: string
	logoSlug: string
	shortName: string
}

/* * */

const AGENCY_CATALOG = Object.freeze({
	'IA9T6': {
		fullName: 'Carris',
		logoSlug: 'ccfl',
		mapOperatorId: 'IA9T6',
		shortName: 'Carris',
		vehicleMapIcon: 'map-vehicle-ccfl-bus',
	},
	'IA2N9': {
		fullName: 'Metro de Lisboa',
		logoSlug: 'ml',
		mapOperatorId: 'IA2N9',
		shortName: 'Metro',
		vehicleMapIcon: 'map-vehicle-ml-train',
	},
	'N18KL': {
		fullName: 'Comboios de Portugal',
		logoSlug: 'cp',
		mapOperatorId: 'N18KL',
		shortName: 'CP',
		vehicleMapIcon: 'map-vehicle-cp-train',
	},
	'LTP61': {
		fullName: 'Transtejo Soflusa',
		logoSlug: 'ttsl',
		mapOperatorId: 'LTP61',
		shortName: 'TTSL',
		vehicleMapIcon: 'map-vehicle-ttsl-boat',
	},
	'A3H3M': {
		fullName: 'Transportes Colectivos do Barreiro',
		logoSlug: 'tcb',
		mapOperatorId: 'A3H3M',
		shortName: 'TCB',
		vehicleMapIcon: 'map-vehicle-tcb-bus',
	},
	'7NTB1': {
		fullName: 'Fertagus',
		logoSlug: 'fertagus',
		mapOperatorId: '7NTB1',
		shortName: 'Fertagus',
		vehicleMapIcon: 'map-vehicle-fertagus-train',
	},
	'KB1F6': {
		fullName: 'Metro Transportes do Sul',
		logoSlug: 'mts',
		mapOperatorId: 'KB1F6',
		shortName: 'MTS',
		vehicleMapIcon: 'map-vehicle-mts-tram',
	},
	'HF16N': {
		fullName: 'MobiCascais',
		logoSlug: 'mobi',
		mapOperatorId: 'HF16N',
		shortName: 'Mobi',
		vehicleMapIcon: 'map-vehicle-mobi-bus',
	},
	'LA77N': {
		fullName: 'Viação Alvorada',
		logoSlug: 'cmet',
		mapOperatorId: 'CM',
		shortName: 'VA',
		vehicleMapIcon: 'map-vehicle-cmet-bus',
	},
	'BNA17': {
		fullName: 'Rodoviária de Lisboa',
		logoSlug: 'cmet',
		mapOperatorId: 'CM',
		shortName: 'RL',
		vehicleMapIcon: 'map-vehicle-cmet-bus',
	},
	'YA15B': {
		fullName: 'Transportes Sul do Tejo',
		logoSlug: 'cmet',
		mapOperatorId: 'CM',
		shortName: 'TST',
		vehicleMapIcon: 'map-vehicle-cmet-bus',
	},
	'A2L1N': {
		fullName: 'ALSA Todi',
		logoSlug: 'cmet',
		mapOperatorId: 'CM',
		shortName: 'ALSA',
		vehicleMapIcon: 'map-vehicle-cmet-bus',
	},
} as const satisfies Record<string, AgencyCatalogEntry>);

const AGENCY_GROUP_CATALOG = Object.freeze({
	CM: {
		fullName: 'Carris Metropolitana',
		logoSlug: 'cmet',
		shortName: 'CM',
	},
} as const satisfies Record<string, AgencyGroupCatalogEntry>);

/* * */

type AgencyId = keyof typeof AGENCY_CATALOG;
type AgencyInfo = (typeof AGENCY_CATALOG)[AgencyId];
type AgencyDisplayInfo = (typeof AGENCY_GROUP_CATALOG)[keyof typeof AGENCY_GROUP_CATALOG] | AgencyInfo;

export type BaseMapOperatorId = (typeof AGENCY_CATALOG)[AgencyId]['mapOperatorId'];

export const AGENCY_IDS = Object.freeze(Object.keys(AGENCY_CATALOG) as AgencyId[]);

/* * */

export function getAgencyInfo(agencyId: null | string | undefined): AgencyInfo | undefined {
	if (!agencyId || !(agencyId in AGENCY_CATALOG)) return;
	return AGENCY_CATALOG[agencyId as AgencyId];
}

export function getAgencyDisplayInfo(agencyId: null | string | undefined): AgencyDisplayInfo | undefined {
	if (!agencyId) return;
	if (agencyId in AGENCY_CATALOG) return AGENCY_CATALOG[agencyId as AgencyId];
	if (agencyId in AGENCY_GROUP_CATALOG) return AGENCY_GROUP_CATALOG[agencyId as keyof typeof AGENCY_GROUP_CATALOG];
}

export function getAgencyLogo(agencyId: null | string | undefined, size: '120x120' | '180x120', mode: 'dark' | 'light'): string | undefined {
	const agency = getAgencyDisplayInfo(agencyId);
	if (!agency) return;

	return `${process.env.NEXT_PUBLIC_BASE_PATH}/assets/navegante/agency-logos/${size}/navegante-agency-logo-${agency.logoSlug}-${size}-${mode}.png`;
}

export function getAgencyMapOperatorId(agencyId: null | string | undefined): BaseMapOperatorId | null {
	return getAgencyInfo(agencyId)?.mapOperatorId ?? null;
}
