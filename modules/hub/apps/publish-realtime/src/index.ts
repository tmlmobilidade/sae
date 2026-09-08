/* * */

import { runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { publishTripUpdates } from './tasks/eta/gtfs/publish-trip-updates.js';
import { publishEtas } from './tasks/eta/simplified/publish-etas.js';
import { publishVehiclesPositions } from './tasks/vehicles/publish-vehicle-positions.js';
import { publishVehiclesMetadata } from './tasks/vehicles/publish-vehicles-metadata.js';

/* * */

let ITERATION = 0;

//
// Initialize Sentry

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'publish-realtime', message: 'Sentry Hub Publish Realtime initialized', module: 'hub', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Hub Publish Realtime' });
}

const main = async () => {
	//

	//
	// Initialize the logger

	Logger.init();
	Logger.title(`[${ITERATION}] Publishing realtime data...`);

	const globalTimer = new Timer();

	//
	// Run all tasks sequentially

	await publishVehiclesPositions();

	if (ITERATION % 15 === 0) await publishVehiclesMetadata(); // Every 15 iterations * 1s + execution time ≈ 30 seconds
	if (ITERATION % 15 === 0) await publishTripUpdates(); // Every 15 iterations * 1s + execution time ≈ 30 seconds
	if (ITERATION % 15 === 0) await publishEtas(); // Every 15 iterations * 1s + execution time ≈ 30 seconds

	ITERATION++;

	//
	// Log the total time taken for all tasks

	Logger.terminate(`[${ITERATION}] Publish realtime data completed in ${globalTimer.get()}`);

	//
};

/* * */

await runOnInterval(main, { intervalMs: '1s' });
