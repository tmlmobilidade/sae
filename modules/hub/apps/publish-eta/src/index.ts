/* * */

import { runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { publishTripUpdates } from './tasks/gtfs/publish-trip-updates.js';
import { publishEtas } from './tasks/simplified/publish-etas.js';

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

	if (ITERATION % 15 === 0) {
		await Promise.all([
			publishEtas(), // Every 15 iterations * 1s + execution time ≈ 30 seconds
			publishTripUpdates(), // Every 15 iterations * 1s + execution time ≈ 30 seconds
		]);
	}

	ITERATION++;

	//
	// Log the total time taken for all tasks

	Logger.terminate(`[${ITERATION}] Publish realtime data completed in ${globalTimer.get()}`);

	//
};

/* * */

await runOnInterval(main, { intervalMs: '1s' });
