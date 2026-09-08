import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createStopOptions } from '../src/components/patterns/shape/shape-editor/ShapeEditorStopSelect/stop-options.js';

/* * */

describe('shape editor stop options', () => {
	test('renders each stop ID only once', () => {
		const options = createStopOptions({
			excludeStopIds: [],
			results: [
				{ _id: '370705', name: 'Stop A' },
				{ _id: '370705', name: 'Stop A duplicate' },
			],
			value: { _id: '370705', name: 'Stop A selected' },
		});

		assert.deepEqual(options, [{ label: 'Stop A (#370705)', value: '370705' }]);
	});

	test('keeps the selected stop available outside the current search results', () => {
		const options = createStopOptions({
			excludeStopIds: [],
			results: [{ _id: '100', name: 'Search result' }],
			value: { _id: '200', name: 'Selected stop' },
		});

		assert.deepEqual(options, [
			{ label: 'Selected stop (#200)', value: '200' },
			{ label: 'Search result (#100)', value: '100' },
		]);
	});
});
