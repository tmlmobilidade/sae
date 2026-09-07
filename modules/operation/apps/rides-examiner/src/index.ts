/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type RidesCoordinatorRidesResponse } from '@tmlmobilidade/go-operation-pckg-types';
import { getCoordinatorUrl } from '@tmlmobilidade/go-operation-pckg-utils';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { runOnInterval, runWithConcurrency } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { analyzeRide } from './utils/analyze-ride.js';
import { augmentRide } from './utils/augment-ride.js';
import { fetchAnalysisData } from './utils/fetch-analysis-data.js';
import { rideAnalysisAtLeastOneVehicleEventOnFirstStopWriter, rideAnalysisAtLeastOneVehicleEventOnLastStopWriter, rideAnalysisExpectedApexValidationIntervalWriter, rideAnalysisExpectedDriverIdQtyWriter, rideAnalysisExpectedStartTimeWriter, rideAnalysisExpectedVehicleEventDelayWriter, rideAnalysisExpectedVehicleEventIntervalWriter, rideAnalysisExpectedVehicleEventQtyWriter, rideAnalysisExpectedVehicleIdQtyWriter, rideAnalysisMatchingApexLocationsWriter, rideAnalysisMatchingVehicleIdsWriter, rideAnalysisSimpleOneApexValidationWriter, rideAnalysisSimpleOneVehicleEventOrApexValidationWriter, rideAnalysisSimpleThreeVehicleEventsWriter, rideAnalysisTransactionSequentialityWriter, ridesWriter } from './utils/writers.js';

/* * */

export async function analyzeRides() {
	try {
		//

		//
		// Initialize Sentry

		try {
			await initSentryNode();
			Logger.startNodeLogs({ app: 'rides-analyzer', message: 'Sentry Rides Examiner initialized', module: 'controller', severity: 'info' });
		} catch (error) {
			Logger.error({ error, message: 'Error initializing Sentry Rides Examiner' });
		}

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
		// Skip this run if there are no rides to process

		if (!rideIdsBatch?.length) {
			Logger.info({ message: 'No rides to process. Skipping run.' });
			return;
		}

		//
		// With the list of Ride IDs, fetch the actual Ride documents to be processsed

		const fetchRideDocumentsTimer = new Timer();

		const ridesBatch = await labDb.operation.rides.queryFromString(`
			SELECT *
			FROM operation.rides
			WHERE _id IN (${rideIdsBatch.map(id => `'${id}'`).join(',')})
			ORDER BY updated_at DESC
			LIMIT 1 BY _id
		`);

		Logger.info({ message: `Processing ${ridesBatch.length} rides... (coordinator: ${fetchCoordinatorTimerResult} | interface: ${fetchRideDocumentsTimer.get()})`, spacesAfterOrBefore: 1 });

		//
		// Process each Ride

		await runWithConcurrency(ridesBatch, ridesBatch.length, async (rideData, rideIndex) => {
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

				const augmentRideTimer = new Timer();

				const augmentedRideData = augmentRide(analysisData);

				const augmentRideTime = augmentRideTimer.get();

				//
				// Run the analyzers and count how many passed,
				// how many failed and how many errored.

				const analyzeRideTimer = new Timer();

				const analyzeRideResults = analyzeRide(analysisData);

				const analyzeRideTime = analyzeRideTimer.get();

				//
				// Insert new versions of the Ride and RideAnalysis documents in parallel

				const insertTimer = new Timer();

				await rideAnalysisAtLeastOneVehicleEventOnFirstStopWriter.write(analyzeRideResults.analyses.at_least_one_vehicle_event_on_first_stop);
				await rideAnalysisAtLeastOneVehicleEventOnLastStopWriter.write(analyzeRideResults.analyses.at_least_one_vehicle_event_on_last_stop);
				await rideAnalysisExpectedApexValidationIntervalWriter.write(analyzeRideResults.analyses.expected_apex_validation_interval);
				await rideAnalysisExpectedDriverIdQtyWriter.write(analyzeRideResults.analyses.expected_driver_id_qty);
				await rideAnalysisExpectedStartTimeWriter.write(analyzeRideResults.analyses.expected_start_time);
				await rideAnalysisExpectedVehicleEventDelayWriter.write(analyzeRideResults.analyses.expected_vehicle_event_delay);
				await rideAnalysisExpectedVehicleEventIntervalWriter.write(analyzeRideResults.analyses.expected_vehicle_event_interval);
				await rideAnalysisExpectedVehicleEventQtyWriter.write(analyzeRideResults.analyses.expected_vehicle_event_qty);
				await rideAnalysisExpectedVehicleIdQtyWriter.write(analyzeRideResults.analyses.expected_vehicle_id_qty);
				await rideAnalysisMatchingApexLocationsWriter.write(analyzeRideResults.analyses.matching_apex_locations);
				await rideAnalysisMatchingVehicleIdsWriter.write(analyzeRideResults.analyses.matching_vehicle_ids);
				await rideAnalysisSimpleOneApexValidationWriter.write(analyzeRideResults.analyses.simple_one_apex_validation);
				await rideAnalysisSimpleOneVehicleEventOrApexValidationWriter.write(analyzeRideResults.analyses.simple_one_vehicle_event_or_apex_validation);
				await rideAnalysisSimpleThreeVehicleEventsWriter.write(analyzeRideResults.analyses.simple_three_vehicle_events);
				await rideAnalysisTransactionSequentialityWriter.write(analyzeRideResults.analyses.transaction_sequentiality);
				await ridesWriter.write({ ...augmentedRideData, processing_status: 'complete', updated_at: Dates.now('utc').unix_milliseconds });

				// const insertPromises = [
				// 	labDb.operation.rideAnalysisAtLeastOneVehicleEventOnFirstStop.insert('JSONEachRow', [analyzeRideResults.analyses.at_least_one_vehicle_event_on_first_stop]),
				// 	labDb.operation.rideAnalysisAtLeastOneVehicleEventOnLastStop.insert('JSONEachRow', [analyzeRideResults.analyses.at_least_one_vehicle_event_on_last_stop]),
				// 	labDb.operation.rideAnalysisExpectedApexValidationInterval.insert('JSONEachRow', [analyzeRideResults.analyses.expected_apex_validation_interval]),
				// 	labDb.operation.rideAnalysisExpectedDriverIdQty.insert('JSONEachRow', [analyzeRideResults.analyses.expected_driver_id_qty]),
				// 	labDb.operation.rideAnalysisExpectedStartTime.insert('JSONEachRow', [analyzeRideResults.analyses.expected_start_time]),
				// 	labDb.operation.rideAnalysisExpectedVehicleEventDelay.insert('JSONEachRow', [analyzeRideResults.analyses.expected_vehicle_event_delay]),
				// 	labDb.operation.rideAnalysisExpectedVehicleEventInterval.insert('JSONEachRow', [analyzeRideResults.analyses.expected_vehicle_event_interval]),
				// 	labDb.operation.rideAnalysisExpectedVehicleEventQty.insert('JSONEachRow', [analyzeRideResults.analyses.expected_vehicle_event_qty]),
				// 	labDb.operation.rideAnalysisExpectedVehicleIdQty.insert('JSONEachRow', [analyzeRideResults.analyses.expected_vehicle_id_qty]),
				// 	labDb.operation.rideAnalysisMatchingApexLocations.insert('JSONEachRow', [analyzeRideResults.analyses.matching_apex_locations]),
				// 	labDb.operation.rideAnalysisMatchingVehicleIds.insert('JSONEachRow', [analyzeRideResults.analyses.matching_vehicle_ids]),
				// 	labDb.operation.rideAnalysisSimpleOneApexValidation.insert('JSONEachRow', [analyzeRideResults.analyses.simple_one_apex_validation]),
				// 	labDb.operation.rideAnalysisSimpleOneVehicleEventOrApexValidation.insert('JSONEachRow', [analyzeRideResults.analyses.simple_one_vehicle_event_or_apex_validation]),
				// 	labDb.operation.rideAnalysisSimpleThreeVehicleEvents.insert('JSONEachRow', [analyzeRideResults.analyses.simple_three_vehicle_events]),
				// 	labDb.operation.rideAnalysisTransactionSequentiality.insert('JSONEachRow', [analyzeRideResults.analyses.transaction_sequentiality]),
				// 	labDb.operation.rides.insert('JSONEachRow', [{ ...augmentedRideData, processing_status: 'complete', updated_at: Dates.now('utc').unix_milliseconds }]),
				// ];

				// await Promise.all(insertPromises);

				const insertTime = insertTimer.get();

				//
				// Log the results

				Logger.info({ message: [
					'[', { a: 'right', c: 7, t: `${ridesBatch.length - rideIndex}/${ridesBatch.length}` }, ']',
					' FETCH: ', { c: 10, t: fetchAnalysisDataTime },
					' AUGMENT: ', { c: 10, t: augmentRideTime },
					' ANALYZE: ', { c: 10, t: analyzeRideTime },
					' INSERT: ', { c: 10, t: insertTime },
					' TOTAL: ', { c: 10, t: rideAnalysisTimer.get() },
					{ c: 50, t: rideData._id },
					{ c: 10, t: `SKIP: ${analyzeRideResults.metrics.skip.length} ` },
					{ c: 10, t: `PASS: ${analyzeRideResults.metrics.pass.length} ` },
					{ c: 10, t: `FAIL: ${analyzeRideResults.metrics.fail.length} ` },
					{ c: 12, t: `ERROR: ${analyzeRideResults.metrics.error.length} [${analyzeRideResults.metrics.error.join('|')}]` },
				] });

				//
			} catch (error) {
				await labDb.operation.rides.insert('JSONEachRow', [{ ...rideData, processing_status: 'error', updated_at: Dates.now('utc').unix_milliseconds }]);
				Logger.error({ error, message: `An error occurred while processing a ride (${rideData._id}): ${error.message}` });
			}
		});

		await rideAnalysisAtLeastOneVehicleEventOnFirstStopWriter.flush();
		await rideAnalysisAtLeastOneVehicleEventOnLastStopWriter.flush();
		await rideAnalysisExpectedApexValidationIntervalWriter.flush();
		await rideAnalysisExpectedDriverIdQtyWriter.flush();
		await rideAnalysisExpectedStartTimeWriter.flush();
		await rideAnalysisExpectedVehicleEventDelayWriter.flush();
		await rideAnalysisExpectedVehicleEventIntervalWriter.flush();
		await rideAnalysisExpectedVehicleEventQtyWriter.flush();
		await rideAnalysisExpectedVehicleIdQtyWriter.flush();
		await rideAnalysisMatchingApexLocationsWriter.flush();
		await rideAnalysisMatchingVehicleIdsWriter.flush();
		await rideAnalysisSimpleOneApexValidationWriter.flush();
		await rideAnalysisSimpleOneVehicleEventOrApexValidationWriter.flush();
		await rideAnalysisSimpleThreeVehicleEventsWriter.flush();
		await rideAnalysisTransactionSequentialityWriter.flush();
		await ridesWriter.flush();

		void fetch('https://status.carrismetropolitana.pt/api/push/B52rdR5Luo30Y1RAtCpHDrn4MF7vXCZb');

		Logger.terminate(`Run took ${globalTimer.get()}.`);

		//
	} catch (err) {
		Logger.error({ error: err, message: `An error occurred. Halting execution: ${err.message}` });
	}
};

/* * */

await runOnInterval(analyzeRides, { intervalMs: '1s' });
