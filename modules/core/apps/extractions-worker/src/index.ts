/* * */

import { type ExtractionsCoordinatorResponse } from '@tmlmobilidade/go-core-pckg-types';
import { getExtractionsCoordinatorUrl } from '@tmlmobilidade/go-core-pckg-utils';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { runOnInterval, startHeartbeat } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { VERSIONS_MAP } from './versions.js';

/* * */

//
// Initialize Sentry

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'rides-feeder', message: 'Sentry Rides Feeder initialized', module: 'controller', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Rides Feeder' });
}

async function main() {
	//

	Logger.init();

	const globalTimer = new Timer();

	//
	// Ask the coordinator for a new Plan ID to process

	const fetchCoordinatorTimer = new Timer();

	const extractionId = await fetch(getExtractionsCoordinatorUrl('extractions'))
		.then(response => response.json())
		.then(data => data as ExtractionsCoordinatorResponse)
		.then(data => data.extraction_id);

	if (!extractionId) {
		console.log(`No extraction to process. Skipping run. (fetch: ${fetchCoordinatorTimer.get()})`);
		return;
	}

	console.log(`Received extraction ID from coordinator: ${extractionId} (fetch: ${fetchCoordinatorTimer.get()})`);

	//
	// Retrieve the extraction from the database

	const currentExtraction = await goDb.core.extractions.findById(extractionId);

	if (!currentExtraction) {
		Logger.error({ message: `Extraction not found: ${extractionId}` });
		return;
	}

	//
	// Run the extraction job.
	// Set a heartbeat to keep the job alive.

	const heartbeat = startHeartbeat({
		intervalMs: 30_000,
		runFn: async () => {
			await goDb.core.extractions.updateById(extractionId, { processing_status: 'processing' });
		},
	});

	try {
		//

		//
		// From the extraction version, run the appropriate task.

		const taskRunner = VERSIONS_MAP[currentExtraction.version];
		if (!taskRunner) throw new Error(`No task runner found for version: ${currentExtraction.version}`);

		await taskRunner(currentExtraction.properties);

		heartbeat.stop();

		//
	} catch (error) {
		heartbeat.stop();
		await goDb.core.extractions.updateById(extractionId, { processing_status: 'error' });
		Logger.error({ error, message: `Error processing extraction ${extractionId}` });
		Logger.divider();
	}

	Logger.terminate(`Run took ${globalTimer.get()}`);
};

/* * */

await runOnInterval(main, { intervalMs: '10s' });
