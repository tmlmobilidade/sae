import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { loadMapAssets } from '../src/components/map/assets/load';

/* * */

describe('map asset loading', () => {
	it('resolves only after every image is registered on the map', async () => {
		let resolveImage: ((value: { data: object }) => void) | undefined;
		const loadedImages = new Set<string>();
		const image = {};
		const map = {
			addImage: (name: string) => loadedImages.add(name),
			hasImage: (name: string) => loadedImages.has(name),
			loadImage: () => new Promise<{ data: object }>((resolve) => {
				resolveImage = resolve;
			}),
		};

		const completion: unknown = loadMapAssets(map as never, [{
			name: 'test-image',
			sdf: false,
			url: '/test-image.png',
		}]);

		assert.ok(completion instanceof Promise);
		assert.equal(loadedImages.has('test-image'), false);

		resolveImage?.({ data: image });
		await completion;

		assert.equal(loadedImages.has('test-image'), true);
	});

	it('reuses an in-progress request for the same map asset', async () => {
		let loadImageCalls = 0;
		let resolveImage: ((value: { data: object }) => void) | undefined;
		const loadedImages = new Set<string>();
		const map = {
			addImage: (name: string) => loadedImages.add(name),
			hasImage: (name: string) => loadedImages.has(name),
			loadImage: () => {
				loadImageCalls += 1;
				return new Promise<{ data: object }>((resolve) => {
					resolveImage = resolve;
				});
			},
		};
		const assets = [{
			name: 'test-image',
			sdf: false,
			url: '/test-image.png',
		}];

		const firstLoad = loadMapAssets(map as never, assets);
		const concurrentLoad = loadMapAssets(map as never, assets);

		assert.equal(loadImageCalls, 1);

		resolveImage?.({ data: {} });
		await Promise.all([firstLoad, concurrentLoad]);

		assert.equal(loadedImages.has('test-image'), true);
	});
});
