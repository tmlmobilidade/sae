import { type RoutePlannerLocation } from '@/types/route-planner/models';
import { buildMotisPlanParams } from '@/utils/route-planner/planning/motis-plan-request';
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

/* * */

const ORIGIN: RoutePlannerLocation = {
	detail: '',
	id: 'GTFS_060001',
	label: 'Paragem',
	type: 'STOP',
};

const DESTINATION: RoutePlannerLocation = {
	detail: '',
	label: 'Destino',
	lat: 38.70775,
	lon: -9.13659,
	type: 'PLACE',
};

describe('buildMotisPlanParams', () => {
	it('builds departure requests with the selected date and standard routing modes', () => {
		const date = new Date('2026-07-22T08:30:00.000Z');
		const params = buildMotisPlanParams(ORIGIN, DESTINATION, { date, mode: 'departure' });

		assert.deepEqual(Object.fromEntries(params), {
			detailedLegs: 'true',
			directModes: 'WALK',
			fromPlace: 'GTFS_060001',
			maxItineraries: '10',
			postTransitModes: 'WALK',
			preTransitModes: 'WALK',
			time: '2026-07-22T08:30:00.000Z',
			toPlace: '38.70775,-9.13659',
			transitModes: 'TRANSIT',
		});
	});

	it('marks arrival requests with arriveBy while keeping the selected date', () => {
		const date = new Date('2026-07-22T18:45:00.000Z');
		const params = buildMotisPlanParams(ORIGIN, DESTINATION, { date, mode: 'arrival' });

		assert.equal(params.get('arriveBy'), 'true');
		assert.equal(params.get('time'), '2026-07-22T18:45:00.000Z');
	});

	it('uses the current time for now requests instead of the stored date', () => {
		const beforeRequest = Date.now();
		const params = buildMotisPlanParams(ORIGIN, DESTINATION, {
			date: new Date('2000-01-01T00:00:00.000Z'),
			mode: 'now',
		});
		const afterRequest = Date.now();
		const requestTime = Date.parse(params.get('time') ?? '');

		assert.equal(params.has('arriveBy'), false);
		assert.equal(requestTime >= beforeRequest, true);
		assert.equal(requestTime <= afterRequest, true);
	});
});
