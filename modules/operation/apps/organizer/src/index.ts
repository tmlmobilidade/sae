/* * */

import { runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { removeOldGtfsValidationsTask } from './tasks/gtfs-validations/remove-old-gtfs-validations.js';
import { normalizePlansTask } from './tasks/plans/normalize-plans/normalize-plans.js';
import { updatePlanHashesTask } from './tasks/plans/update-plan-hashes/update-plan-hashes.js';
import { removeOrphanAnalysesTask } from './tasks/rides/remove-orphan-analyses.js';
import { removeOrphanHashedShapesTask } from './tasks/rides/remove-orphan-hashed-shapes.js';
import { removeOrphanHashedTripsTask } from './tasks/rides/remove-orphan-hashed-trips.js';
import { removeOrphanRidesTask } from './tasks/rides/remove-orphan-rides.js';

/* * */

async function reprocessStuckRides() {
	//

	//
	// Initialize Sentry

	try {
		await initSentryNode();
		Logger.startNodeLogs({ app: 'organizer', message: 'Sentry Organizer initialized', module: 'operation', severity: 'info' });
	} catch (error) {
		Logger.error({ error, message: 'Error initializing Sentry Organizer' });
	}

	//
	// Initialize the logger

	Logger.init();

	const globalTimer = new Timer();

	/* * */
	/* GTFS VALIDATIONS */

	await removeOldGtfsValidationsTask();

	/* * */
	/* PLANS */

	await updatePlanHashesTask();
	await normalizePlansTask();

	/* * */
	/* RIDES */

	await removeOrphanRidesTask();
	await removeOrphanAnalysesTask();
	await removeOrphanHashedShapesTask();
	await removeOrphanHashedTripsTask();

	/* * */

	Logger.terminate(`Run took ${globalTimer.get()}.`);

	//
};

/* * */

await runOnInterval(reprocessStuckRides, { intervalMs: '10m' });
