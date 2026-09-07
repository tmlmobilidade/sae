import { type MotisGeocodeResult, type RoutePlannerLocation } from '@/types/route-planner/models';
import { createRoutePlannerCurrentLocation, mapHubStopToRoutePlannerLocation } from '@/utils/route-planner/planning/locations';
import { formatMotisLocationDetail } from '@/utils/route-planner/presentation/format';
import { getMotisPlaceParam, mapMotisGeocodeResultToLocation, parseRoutePlannerCoordinate, routePlannerCoordinateToLocation } from '@/utils/search/motis-geocode';
import { HubStopSchema } from '@tmlmobilidade/go-types-hub';
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

/* * */

describe('MOTIS geocode location mapping', () => {
	it('preserves geocode metadata and builds a useful address detail', () => {
		const result: MotisGeocodeResult = {
			areas: [
				{ adminLevel: 10, matched: true, name: 'Estação Oriente' },
				{ adminLevel: 8, matched: true, name: 'Lisboa' },
				{ adminLevel: 6, matched: false, name: 'Distrito de Lisboa' },
				{ adminLevel: 3, matched: false, name: 'Portugal' },
			],
			category: 'station',
			country: 'PT',
			houseNumber: '1',
			id: 'stop-oriente',
			lat: 38.76784,
			level: 0,
			lon: -9.09958,
			modes: ['BUS', 'RAIL'],
			name: 'Estação Oriente',
			score: 0.99,
			street: 'Avenida de Berlim',
			tokens: [],
			type: 'STOP',
			zip: '1990-096',
		};

		assert.deepEqual(mapMotisGeocodeResultToLocation(result, 'Local sem nome'), {
			areas: result.areas,
			category: 'station',
			country: 'PT',
			detail: 'Avenida de Berlim 1 · 1990-096 Lisboa Distrito de Lisboa',
			houseNumber: '1',
			id: 'stop-oriente',
			label: 'Estação Oriente',
			lat: 38.76784,
			level: 0,
			lon: -9.09958,
			modes: ['BUS', 'RAIL'],
			street: 'Avenida de Berlim',
			type: 'STOP',
			zip: '1990-096',
		});
	});

	it('uses coordinates for unnamed geocode results and a PLACE fallback type', () => {
		const result: MotisGeocodeResult = {
			areas: [],
			id: 'unnamed',
			lat: 38.7,
			lon: -9.1,
			name: '',
			score: 0.5,
			tokens: [],
			type: 'PLACE',
		};

		assert.equal(mapMotisGeocodeResultToLocation(result, 'Local sem nome').label, '38.7,-9.1');
		assert.equal(mapMotisGeocodeResultToLocation(result, 'Local sem nome').type, 'PLACE');
	});

	it('omits generic, duplicate, and excess address parts from detail text', () => {
		const location: RoutePlannerLocation = {
			areas: [
				{ name: 'Cais do Sodré' },
				{ name: 'Lisboa' },
				{ name: 'lisboa' },
				{ name: 'Área Metropolitana de Lisboa' },
				{ name: 'Portugal' },
			],
			detail: '',
			houseNumber: 'none',
			label: 'Cais do Sodré',
			street: 'PLACE',
			type: 'STOP',
			zip: '1200-450',
		};

		assert.equal(formatMotisLocationDetail(location), '1200-450 Lisboa Área Metropolitana de Lisboa');
	});
});

describe('route-planner stop and coordinate locations', () => {
	it('creates a rounded route location from current coordinates and translated labels', () => {
		assert.deepEqual(createRoutePlannerCurrentLocation({
			detail: 'A sua localização atual',
			label: 'Localização atual',
			latitude: 38.7077514,
			longitude: -9.1365946,
		}), {
			detail: 'A sua localização atual',
			label: 'Localização atual',
			lat: 38.707751,
			lon: -9.136595,
			type: 'PLACE',
		});
	});

	it('rejects non-finite current coordinates', () => {
		assert.equal(createRoutePlannerCurrentLocation({
			detail: 'A sua localização atual',
			label: 'Localização atual',
			latitude: Number.NaN,
			longitude: -9.13659,
		}), null);
	});

	it('maps Hub stops while preserving each search path stop-ID convention', () => {
		const stop = HubStopSchema.parse({
			_id: '600001',
			agency_ids: ['41'],
			district_id: '11',
			district_name: 'Lisboa',
			flags: [],
			latitude: 38.70775,
			legacy_ids: [],
			lifecycle_status: 'active',
			line_ids: ['1000'],
			locality_id: 'lisboa',
			locality_name: 'Baixa',
			longitude: -9.13659,
			municipality_id: '1106',
			municipality_name: 'Lisboa',
			name: 'Praça do Comércio',
			parish_id: '110608',
			parish_name: 'Santa Maria Maior',
			pattern_ids: ['1000_0_1'],
			route_ids: ['1000_0'],
			short_name: '060001',
			tts_name: 'Praça do Comércio',
		});
		const expectedLocation = {
			detail: 'Baixa | Lisboa',
			label: 'Praça do Comércio',
			lat: 38.70775,
			lon: -9.13659,
			type: 'STOP',
		};

		assert.deepEqual(mapHubStopToRoutePlannerLocation(stop), { ...expectedLocation, id: '600001' });
		assert.deepEqual(mapHubStopToRoutePlannerLocation(stop, { ensureGtfsId: true }), { ...expectedLocation, id: 'GTFS_600001' });
	});

	it('converts both raw and already-prefixed stop IDs to one MOTIS GTFS place parameter', () => {
		const stop: RoutePlannerLocation = { detail: '', id: '060001', label: 'Paragem', type: 'STOP' };
		const prefixedStop: RoutePlannerLocation = { ...stop, id: 'GTFS_060001' };

		assert.equal(getMotisPlaceParam(stop), 'GTFS_060001');
		assert.equal(getMotisPlaceParam(prefixedStop), 'GTFS_060001');
	});

	it('converts coordinate locations to MOTIS latitude, longitude, and optional level parameters', () => {
		assert.equal(getMotisPlaceParam({ detail: '', label: 'Piso', lat: 38.7, level: -1, lon: -9.1, type: 'PLACE' }), '38.7,-9.1,-1');
		assert.equal(getMotisPlaceParam({ detail: '', label: 'Local', lat: 38.7, lon: -9.1, type: 'PLACE' }), '38.7,-9.1');
	});

	it('falls back to the location label when an ID or coordinates cannot identify it', () => {
		assert.equal(getMotisPlaceParam({ detail: '', label: 'Lisboa', type: 'PLACE' }), 'Lisboa');
	});

	it('parses valid coordinates and maps them to a selectable location', () => {
		assert.deepEqual(parseRoutePlannerCoordinate(' 38.70775, -9.13659 '), { lat: 38.70775, lon: -9.13659 });
		assert.deepEqual(routePlannerCoordinateToLocation(' 38.70775, -9.13659 ', 'Coordenadas'), {
			detail: 'Coordenadas | 38.70775, -9.13659',
			label: '38.70775,-9.13659',
			lat: 38.70775,
			lon: -9.13659,
			type: 'PLACE',
		});
	});

	it('rejects malformed and out-of-range coordinates', () => {
		for (const value of ['38.7', 'north,west', '91,-9.1', '38.7,-181']) {
			assert.equal(parseRoutePlannerCoordinate(value), null);
			assert.equal(routePlannerCoordinateToLocation(value, 'Coordenadas'), null);
		}
	});
});
