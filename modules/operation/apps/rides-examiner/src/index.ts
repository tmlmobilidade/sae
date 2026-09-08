/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type RidesCoordinatorRidesResponse } from '@tmlmobilidade/go-operation-pckg-types';
import { getCoordinatorUrl, getRideHash } from '@tmlmobilidade/go-operation-pckg-utils';
import { type HashableRide, RideSchema } from '@tmlmobilidade/go-types-operation';
import { runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { analyzeRide } from './utils/analyze-ride.js';
import { augmentRide } from './utils/augment-ride.js';
import { fetchAnalysisData } from './utils/fetch-analysis-data.js';

/* * */
//
// Initialize Sentry

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'rides-examiner', message: 'Sentry Rides Examiner initialized', module: 'controller', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Rides Examiner' });
}

export async function validateRides() {
	try {
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
		// Process each Ride

		for (const [rideIndex, rideData] of ridesBatch.entries()) {
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
				// Augment the current Ride with additional information retrieved
				// from the fetched dynamic data. Some of this data will be used by the analyzers.

				const augmentedRideData = augmentRide({
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

				//
				// Build the hashable ride object and get the hash value

				const hashableRide: HashableRide = {
					...augmentedRideData,
					analyses: analyzeRide({
						apex_banking_taps: analysisData.apex_banking_taps,
						apex_locations: analysisData.apex_locations,
						apex_refunds: analysisData.apex_refunds,
						apex_sales: analysisData.apex_sales,
						apex_validations: analysisData.apex_validations,
						hashed_shape: analysisData.hashed_shape,
						hashed_trip: analysisData.hashed_trip,
						ride: augmentedRideData,
						vehicle_events: analysisData.vehicle_events,
					}),
				};

				const rideHashValue = getRideHash(hashableRide);

				//
				// Update the current Ride with the analysis result
				// and 'complete' status to indicate that the ride has been processed.

				const validatedRide = RideSchema.parse({
					...hashableRide,
					hash: rideHashValue,
				});

				await goDb.operation.rides.updateById(rideData._id, {
					...validatedRide,
					processing_status: 'complete',
				});

				//
				// Run the analyzers and count how many passed,
				// how many failed and how many errored.

				if (!validatedRide.analyses) throw new Error(`Analyses object is unavailable for ride after analysis run: ${rideData._id}`);

				const skipAnalysisCount = Object.entries(validatedRide.analyses).filter(([, value]) => value.grade_status === 'skip').map(([key]) => key);
				const passAnalysisCount = Object.entries(validatedRide.analyses).filter(([, value]) => value.grade_status === 'pass').map(([key]) => key);
				const failAnalysisCount = Object.entries(validatedRide.analyses).filter(([, value]) => value.grade_status === 'fail').map(([key]) => key);
				const errorAnalysisCount = Object.entries(validatedRide.analyses).filter(([, value]) => value.grade_status === 'error').map(([key]) => key);

				Logger.info({ message: [
					'[', { a: 'right', c: 7, t: `${ridesBatch.length - rideIndex}/${ridesBatch.length}` }, ']',
					' F: ', { c: 5, t: fetchAnalysisDataTime },
					' T: ', { c: 7, t: rideAnalysisTimer.get() },
					{ c: 50, t: rideData._id },
					{ c: 10, t: `SKIP: ${skipAnalysisCount.length} ` },
					{ c: 10, t: `PASS: ${passAnalysisCount.length} ` },
					{ c: 10, t: `FAIL: ${failAnalysisCount.length} ` },
					{ c: 12, t: `ERROR: ${errorAnalysisCount.length} [${errorAnalysisCount.join('|')}]` },
				] });

				//
			} catch (error) {
				await goDb.operation.rides.updateById(rideData._id, { processing_status: 'error' });
				Logger.error({ error, message: `An error occurred while processing a ride (${rideData._id}): ${error.message}` });
			}
		}

		//

		void fetch('https://status.carrismetropolitana.pt/api/push/B52rdR5Luo30Y1RAtCpHDrn4MF7vXCZb');

		Logger.terminate(`Run took ${globalTimer.get()}.`);

		//
	} catch (err) {
		Logger.error({ error: err, message: `An error occurred. Halting execution: ${err.message}` });
		Logger.error({ message: 'Retrying in 10 seconds...' });
		setTimeout(() => {
			process.exit(1); // End process
		}, 10000); // after 10 seconds
	}
};

/* * */

await runOnInterval(validateRides, { intervalMs: '1s' });
