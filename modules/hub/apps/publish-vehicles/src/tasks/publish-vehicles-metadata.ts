/* * */

import { getVehiclesMetadataMap } from '@/utils/get-vehicles-metadata-map.js';
import { cacheDb } from '@tmlmobilidade/go-interfaces-cachedb';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/* * */

export async function publishVehiclesMetadata() {
	//

	const timer = new Timer();

	Logger.title('Publishing vehicles metadata...');

	//
	// Retrieve the vehicles metadata map

	const vehiclesMetadataMap = await getVehiclesMetadataMap();

	await cacheDb.set('hub:v1:realtime:vehicles:metadata:json', JSON.stringify(Array.from(vehiclesMetadataMap.values())));

	Logger.success(`Finished publishing vehicles metadata (${timer.get()})`);
};

