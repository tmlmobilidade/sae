import { getRoutePlannerCloseAction, getRoutePlannerItineraryDetailInitialSnap, getRoutePlannerMapFitFeatures, getRoutePlannerTravelTimeModeTransition } from '@/utils/route-planner/planning/navigation';
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

/* * */

describe('getRoutePlannerCloseAction', () => {
	it('returns to route results when location search is dismissed with an existing route', () => {
		const action = getRoutePlannerCloseAction({
			hasRouteContext: true,
			isNavigating: false,
			viewMode: 'destination-search',
			wasOpenedFromPlace: false,
		});

		assert.equal(action, 'open-results');
	});

	it('closes an initial location search that has no route context', () => {
		const action = getRoutePlannerCloseAction({
			hasRouteContext: false,
			isNavigating: false,
			viewMode: 'destination-search',
			wasOpenedFromPlace: false,
		});

		assert.equal(action, 'close-sheet');
	});

	it('preserves the existing results and itinerary-detail close transitions', () => {
		assert.equal(getRoutePlannerCloseAction({
			hasRouteContext: true,
			isNavigating: false,
			viewMode: 'results',
			wasOpenedFromPlace: false,
		}), 'clear-route');

		assert.equal(getRoutePlannerCloseAction({
			hasRouteContext: true,
			isNavigating: false,
			viewMode: 'results',
			wasOpenedFromPlace: true,
		}), 'open-place-detail');

		assert.equal(getRoutePlannerCloseAction({
			hasRouteContext: true,
			isNavigating: false,
			viewMode: 'itinerary-detail',
			wasOpenedFromPlace: false,
		}), 'open-results');

		assert.equal(getRoutePlannerCloseAction({
			hasRouteContext: true,
			isNavigating: true,
			viewMode: 'itinerary-detail',
			wasOpenedFromPlace: false,
		}), 'dismiss-trip-sheets');
	});
});

describe('getRoutePlannerTravelTimeModeTransition', () => {
	it('refreshes the date when entering or leaving now mode and otherwise preserves it', () => {
		const storedDate = new Date('2026-07-20T08:00:00.000Z');
		const currentDate = new Date('2026-07-22T10:00:00.000Z');

		assert.deepEqual(getRoutePlannerTravelTimeModeTransition({ date: storedDate, mode: 'departure' }, 'arrival', currentDate), {
			date: storedDate,
			mode: 'arrival',
		});
		assert.deepEqual(getRoutePlannerTravelTimeModeTransition({ date: storedDate, mode: 'now' }, 'departure', currentDate), {
			date: currentDate,
			mode: 'departure',
		});
		assert.deepEqual(getRoutePlannerTravelTimeModeTransition({ date: storedDate, mode: 'departure' }, 'now', currentDate), {
			date: currentDate,
			mode: 'now',
		});
	});
});

describe('active itinerary presentation', () => {
	it('opens active detail at compact snap position 1', () => {
		assert.equal(getRoutePlannerItineraryDetailInitialSnap(true), 1);
	});

	it('fits the map to the first leg trajectory in itinerary detail', () => {
		const firstLeg = createLineFeature([[0, 0], [1, 1]]);
		const secondLeg = createLineFeature([[1, 1], [2, 2]]);

		assert.deepEqual(getRoutePlannerMapFitFeatures([firstLeg, secondLeg], 'itinerary-detail'), [firstLeg]);
	});
});

function createLineFeature(coordinates: GeoJSON.Position[]): GeoJSON.Feature<GeoJSON.LineString> {
	return {
		geometry: { coordinates, type: 'LineString' },
		properties: {},
		type: 'Feature',
	};
}
