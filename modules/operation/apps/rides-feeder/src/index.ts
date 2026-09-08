/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type RidesCoordinatorPlansResponse } from '@tmlmobilidade/go-operation-pckg-types';
import { getCoordinatorUrl, setPlanStatus } from '@tmlmobilidade/go-operation-pckg-utils';
import { runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { parsePlanTask } from './tasks/parse-plan.js';

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

	const planId = await fetch(getCoordinatorUrl('plans'))
		.then(response => response.json())
		.then(data => data as RidesCoordinatorPlansResponse)
		.then(data => data.plan_id);

	if (!planId) {
		console.log(`No plan to process. Skipping run. (fetch: ${fetchCoordinatorTimer.get()})`);
		return;
	}

	console.log(`Received plan ID from coordinator: ${planId} (fetch: ${fetchCoordinatorTimer.get()})`);

	//
	// Retrieve the plan from the database

	const currentPlan = await goDb.operation.plans.findById(planId);

	if (!currentPlan) {
		Logger.error({ message: `Plan not found: ${planId}` });
		return;
	}

	//
	// Parse the plan

	try {
		await parsePlanTask(currentPlan);
	} catch (error) {
		await setPlanStatus(currentPlan._id, 'rides_feeder', 'error');
		Logger.error({ error, message: `Error processing plan ${currentPlan._id}` });
		Logger.divider();
	}

	Logger.terminate(`Run took ${globalTimer.get()}`);
};

/* * */

await runOnInterval(main, { intervalMs: '10s' });
