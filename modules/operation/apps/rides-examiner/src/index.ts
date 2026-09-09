/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type RidesCoordinatorRidesResponse } from '@tmlmobilidade/go-operation-pckg-types';
import { getCoordinatorUrl } from '@tmlmobilidade/go-operation-pckg-utils';
import { runOnInterval, runWithConcurrency } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { analyzeRide } from './tasks/analyze-ride.js';
import { augmentRide } from './tasks/augment-ride.js';
import { fetchAnalysisData } from './utils/fetch-analysis-data.js';
import { writers } from './utils/writers.js';

/* * */

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'rides-examiner', message: 'Sentry Rides Examiner initialized', module: 'controller', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Rides Examiner' });
}

/* * */

export async function main() {
	//

	//
	// Initialize the logger

	Logger.init();

	const globalTimer = new Timer();

	//
	// Ask the coordinator for a batch of Ride IDs to process

	const fetchCoordinatorTimer = new Timer();

	const rideIdsBatch = await fetch(getCoordinatorUrl('rides'))
		.then(response => response.json())
		.then(data => data as RidesCoordinatorRidesResponse)
		.then(data => data.ride_ids);

	const fetchCoordinatorTimerResult = fetchCoordinatorTimer.get();

	//
	// With the list of Ride IDs, fetch the actual Ride documents to be processsed

	const fetchRideDocumentsTimer = new Timer();

	const ridesBatch = await goDb.operation.rides.findMany({ _id: { $in: rideIdsBatch || [] } });

	Logger.info({ message: `Processing ${ridesBatch.length} rides... (coordinator: ${fetchCoordinatorTimerResult} | interface: ${fetchRideDocumentsTimer.get()})`, spacesAfterOrBefore: 1 });

	//
	// Process each Ride in parallel

	await runWithConcurrency(ridesBatch, 100, async (rideData, index) => {
		try {
			//

			const rideAnalysisTimer = new Timer();

			//
			// For this ride, fetch all the necessary data for analysis.
			// This includes static data, like hashed shapes and trips, and dynamic data,
			// like vehicle events and apex transactions. Request all data in parallel.

			const fetchAnalysisDataTimer = new Timer();

			const analysisData = await fetchAnalysisData(rideData);

			const fetchAnalysisDataTime = fetchAnalysisDataTimer.get();

			//
			// Augment the current Ride with additional information
			// retrieved from the fetched dynamic data.

			const augmentRideTimer = new Timer();

			const augmentedRideData = await augmentRide({
				apex_banking_taps: analysisData.apex_banking_taps,
				apex_locations: analysisData.apex_locations,
				apex_refunds: analysisData.apex_refunds,
				apex_sales: analysisData.apex_sales,
				apex_validations: analysisData.apex_validations,
				hashed_shape: analysisData.hashed_shape,
				hashed_trip: analysisData.hashed_trip,
				ride: rideData,
				vehicle_events: analysisData.vehicle_events,
			});

			const augmentRideTime = augmentRideTimer.get();

			//
			// Run the analyzers on the augmented ride data.

			const analyzeRideTimer = new Timer();

			const analysesResult = await analyzeRide({
				apex_banking_taps: analysisData.apex_banking_taps,
				apex_locations: analysisData.apex_locations,
				apex_refunds: analysisData.apex_refunds,
				apex_sales: analysisData.apex_sales,
				apex_validations: analysisData.apex_validations,
				hashed_shape: analysisData.hashed_shape,
				hashed_trip: analysisData.hashed_trip,
				ride: augmentedRideData,
				vehicle_events: analysisData.vehicle_events,
			});

			const analyzeRideTime = analyzeRideTimer.get();

			//
			// Log the results of the analysis.

			Logger.info({ message: [
				'[', { a: 'right', c: 7, t: `${ridesBatch.length - index}/${ridesBatch.length}` }, ']',
				' FETCH: ', { c: 10, t: fetchAnalysisDataTime },
				' AUGMENT: ', { c: 10, t: augmentRideTime },
				' ANALYZE: ', { c: 10, t: analyzeRideTime },
				' TOTAL: ', { c: 10, t: rideAnalysisTimer.get() },
				{ c: 50, t: rideData._id },
				{ c: 10, t: `SKIP: ${analysesResult.skip.length} ` },
				{ c: 10, t: `PASS: ${analysesResult.pass.length} ` },
				{ c: 10, t: `FAIL: ${analysesResult.fail.length} ` },
				{ c: 12, t: `ERROR: ${analysesResult.error.length} [${analysesResult.error.join('|')}]` },
			] });

			//
		} catch (error) {
			await goDb.operation.rides.updateById(rideData._id, { processing_status: 'error' });
			Logger.error({ error, message: `An error occurred while processing a ride (${rideData._id}): ${error.message}` });
		}
	});

	//
	// Flush all the writers

	await Promise.all(Object.values(writers).map(writer => writer.flush()));

	//
	// Send a signal to the uptime monitor

	void fetch('https://status.carrismetropolitana.pt/api/push/B52rdR5Luo30Y1RAtCpHDrn4MF7vXCZb');

	Logger.terminate(`Run took ${globalTimer.get()}.`);
};

/* * */

await runOnInterval(main, { intervalMs: '1s' });
