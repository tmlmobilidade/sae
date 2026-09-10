import { MAP_BOTTOM_SHEET_SNAP_POINTS } from '@/constants/bottom-sheet';
import { getBottomSheetSnapState, getMapInteractionCollapseTarget } from '@/utils/bottom-sheet/behavior';
import { reduceBottomSheetNavigation } from '@/utils/bottom-sheet/navigation';
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

/* * */

describe('map-aware bottom-sheet collapse behavior', () => {
	it('collapses an expanded sheet to its compact snap for a user map gesture', () => {
		assert.equal(getMapInteractionCollapseTarget({
			compactSnapIndex: 1,
			hasOriginalEvent: true,
			snapIndex: 3,
		}), 1);
		assert.equal(getMapInteractionCollapseTarget({
			compactSnapIndex: 1,
			hasOriginalEvent: false,
			snapIndex: 3,
		}), null);
	});
});

describe('bottom-sheet snap publication', () => {
	it('keeps the full-open snap required by react-modal-sheet', () => {
		assert.equal(MAP_BOTTOM_SHEET_SNAP_POINTS.at(-2), 0.95);
		assert.equal(MAP_BOTTOM_SHEET_SNAP_POINTS.at(-1), 1);
	});

	it('publishes the snap point represented by the selected index', () => {
		assert.deepEqual(getBottomSheetSnapState([0, 0.28, 0.64, 0.95, 1], 2), {
			snapIndex: 2,
			snapPoint: 0.64,
		});
	});
});

describe('bottom-sheet navigation operations', () => {
	const search = { entityId: null, view: 'search' as const };
	const stop = { entityId: 'stop-1', view: 'stops-detail' as const };
	const routes = { entityId: null, view: 'routes' as const };

	it('pushes a sheet while preserving the previous entry', () => {
		assert.deepEqual(reduceBottomSheetNavigation([search], { entry: stop, type: 'push' }), [search, stop]);
	});

	it('replaces only the active sheet', () => {
		assert.deepEqual(reduceBottomSheetNavigation([search, stop], { entry: routes, type: 'replace-active' }), [search, routes]);
		assert.deepEqual(reduceBottomSheetNavigation([], { entry: routes, type: 'replace-active' }), [routes]);
	});

	it('pops the active sheet and can clear the full stack', () => {
		assert.deepEqual(reduceBottomSheetNavigation([search, stop], { type: 'pop' }), [search]);
		assert.deepEqual(reduceBottomSheetNavigation([search, stop], { type: 'clear' }), []);
	});
});
