/* * */

import { type Map as MapLibreMap } from 'maplibre-gl';

/**
 * Represents a map asset definition.
 */
export interface MapAssetType {
	name: string
	sdf: boolean
	url: string
}

/* * */

const MAP_ASSET_LOADS = new WeakMap<MapLibreMap, Map<string, Promise<void>>>();

/* * */

async function loadMapAsset(mapObject: MapLibreMap, asset: MapAssetType) {
	if (mapObject.hasImage(asset.name)) return;

	let mapAssetLoads = MAP_ASSET_LOADS.get(mapObject);
	if (!mapAssetLoads) {
		mapAssetLoads = new Map();
		MAP_ASSET_LOADS.set(mapObject, mapAssetLoads);
	}

	const activeLoad = mapAssetLoads.get(asset.name);
	if (activeLoad !== undefined) return activeLoad;

	const assetLoad = (async () => {
		const fullAssetUrl = asset.url.startsWith('/') ? `${process.env.NEXT_PUBLIC_BASE_PATH}${asset.url}` : asset.url;
		const image = await mapObject.loadImage(fullAssetUrl);
		if (mapObject.hasImage(asset.name)) return;
		mapObject.addImage(asset.name, image.data, { sdf: asset.sdf });
	})();

	mapAssetLoads.set(asset.name, assetLoad);

	try {
		await assetLoad;
	} finally {
		mapAssetLoads.delete(asset.name);
		if (mapAssetLoads.size === 0) MAP_ASSET_LOADS.delete(mapObject);
	}
}

/* * */

/**
 * Loads given map assets into the specified map object.
 * @param mapObject The map object to load assets into.
 * @param mapAssets The map assets to load.
 */
export async function loadMapAssets(mapObject: MapLibreMap | null | undefined, mapAssets: MapAssetType[]) {
	// Skip if no map object is provided
	if (!mapObject) return;
	// Load and register every asset before reporting that the map is ready
	await Promise.all(mapAssets.map(async asset => await loadMapAsset(mapObject, asset)));
}
