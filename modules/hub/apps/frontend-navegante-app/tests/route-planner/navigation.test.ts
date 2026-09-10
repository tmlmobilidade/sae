import { getRoutePlannerBackAction, getRoutePlannerDismissAction, getRoutePlannerItineraryDetailInitialSnap, getRoutePlannerMapFitFeatures, getRoutePlannerTravelTimeModeTransition } from '@/utils/route-planner/planning/navigation';
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

/* * */

describe('route-planner navigation actions', () => {
	it('returns to route results when navigating back from location search', () => {
		const action = getRoutePlannerBackAction({
			hasRouteContext: true,
			isNavigating: false,
			locationSearchReturnView: 'results',
			viewMode: 'destination-search',
			wasOpenedFromPlace: false,
		});

		assert.equal(action, 'open-results');
	});

	it('has no back destination for an initial location search', () => {
		const action = getRoutePlannerBackAction({
			hasRouteContext: false,
			isNavigating: false,
			locationSearchReturnView: 'results',
			viewMode: 'destination-search',
			wasOpenedFromPlace: false,
		});

		assert.equal(action, null);
	});

	it('returns to place detail when navigating back from origin selection', () => {
		const action = getRoutePlannerBackAction({
			hasRouteContext: false,
			isNavigating: false,
			locationSearchReturnView: 'place-detail',
			viewMode: 'destination-search',
			wasOpenedFromPlace: true,
		});

		assert.equal(action, 'open-place-detail');
	});

	it('preserves internal results and itinerary-detail back transitions', () => {
		assert.equal(getRoutePlannerBackAction({
			hasRouteContext: true,
			isNavigating: false,
			locationSearchReturnView: 'results',
			viewMode: 'results',
			wasOpenedFromPlace: false,
		}), null);

		assert.equal(getRoutePlannerBackAction({
			hasRouteContext: true,
			isNavigating: false,
			locationSearchReturnView: 'place-detail',
			viewMode: 'results',
			wasOpenedFromPlace: true,
		}), 'open-place-detail');

		assert.equal(getRoutePlannerBackAction({
			hasRouteContext: true,
			isNavigating: false,
			locationSearchReturnView: 'results',
			viewMode: 'itinerary-detail',
			wasOpenedFromPlace: false,
		}), 'open-results');

		assert.equal(getRoutePlannerBackAction({
			hasRouteContext: true,
			isNavigating: true,
			locationSearchReturnView: 'results',
			viewMode: 'itinerary-detail',
			wasOpenedFromPlace: false,
		}), null);
	});

	it('clears a non-navigation route when its sheet is dismissed', () => {
		assert.equal(getRoutePlannerDismissAction({ isNavigating: false }), 'clear-route');
	});

	it('only hides the sheet when an active trip is dismissed', () => {
		assert.equal(getRoutePlannerDismissAction({ isNavigating: true }), 'dismiss-trip-sheets');
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
