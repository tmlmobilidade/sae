/* * */

import { AppConfig } from '@/lib/config.js';
import { cleanupCurrentRides } from '@/tasks/cleanup-current-rides.js';
import { cleanupCurrentVehicleEvents } from '@/tasks/cleanup-current-vehicle-events.js';
import { cleanupCurrentWaypoints } from '@/tasks/cleanup-current-waypoints.js';
import { cleanupHistoricalNodeTravelTimesAggregation } from '@/tasks/cleanup-historical-node-travel-times-aggregation.js';
import { cleanupHistoricalNodeTravelTimes } from '@/tasks/cleanup-historical-node-travel-times.js';
import { cleanupHistoricalRides } from '@/tasks/cleanup-historical-rides.js';
import { cleanupHistoricalVehicleEvents } from '@/tasks/cleanup-historical-vehicle-events.js';
import { runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { fetchHistoricalRidesForDayIndex } from './tasks/fetch-historical-rides-for-day-index.js';

/* * */

export async function main() {
	//

	//
	// Initialize Sentry

	try {
		await initSentryNode();
		Logger.startNodeLogs({ app: 'cleaner', message: 'Sentry ETA Cleaner initialized', module: 'eta', severity: 'info' });
	} catch (error) {
		Logger.error({ error, message: 'Error initializing Sentry ETA Cleaner' });
	}

	//
	// Initialize the logger

	Logger.init();
	const globalTimer = new Timer();

	//
	// Cleanup current rides

	if (AppConfig.pipelineSteps.cleanupCurrentRides) {
		await cleanupCurrentRides();
	}

	//
	// Cleanup current waypoints

	if (AppConfig.pipelineSteps.cleanupCurrentWaypoints) {
		await cleanupCurrentWaypoints();
	}

	//
	// Cleanup current vehicle events

	if (AppConfig.pipelineSteps.cleanupCurrentVehicleEvents) {
		await cleanupCurrentVehicleEvents();
	}

	//
	// Cleanup historical rides

	if (AppConfig.pipelineSteps.cleanupHistoricalRides) {
		// Fetch the same historical window the loader inserts so we can
		// determine which hist_rides are still considered in-window.
		const keepRideIds = (await fetchHistoricalRidesForDayIndex()).map(ride => ride._id);
		Logger.info({ message: `Found ${keepRideIds.length} historical rides in current window` });

		await cleanupHistoricalRides(keepRideIds);
	}

	//
	// Cleanup historical vehicle events

	if (AppConfig.pipelineSteps.cleanupHistoricalVehicleEvents) {
		await cleanupHistoricalVehicleEvents();
	}

	//
	// Cleanup historical node travel times

	if (AppConfig.pipelineSteps.cleanupHistoricalNodeTravelTimes) {
		await cleanupHistoricalNodeTravelTimes();
	}

	//
	// Cleanup historical node travel times aggregation

	if (AppConfig.pipelineSteps.cleanupHistoricalNodeTravelTimesAggregation) {
		await cleanupHistoricalNodeTravelTimesAggregation();
	}

	Logger.success(`Cleaner completed in ${globalTimer.get()} seconds`);
}

/* * */

runOnInterval(main, { intervalMs: AppConfig.interval });
