/* * */

import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { apexT11, apexT19, hashedShapes, hashedTrips, rides, vehicleEvents } from '@tmlmobilidade/services/interfaces';
import { ALLOWED_VALIDATION_STATUSES, RideAnalysis } from '@tmlmobilidade/services/types';

/* * */

import { AnalysisData } from '@/types/analysis-data.type.js';
import { detectEndEvent } from '@/utils/detect-end-event.util.js';
import { detectFirstEvent } from '@/utils/detect-first-event.util.js';
import { detectLastEvent } from '@/utils/detect-last-event.util.js';
import { detectStartEvent } from '@/utils/detect-start-event.util.js';
import { getObservedExtension } from '@/utils/get-observed-extension.util.js';

/* * */

import { atMostTwoDriverIdsAnalyzer } from '@/analyzers/atMostTwoDriverIds.analyzer.js';
import { atMostTwoVehicleIdsAnalyzer } from '@/analyzers/atMostTwoVehicleIds.analyzer.js';
import { excessiveVehicleEventDelayAnalyzer } from '@/analyzers/excessiveVehicleEventDelay.analyzer.js';
import { geoDelayedStartFirstOutAnalyzer } from '@/analyzers/geoDelayedStartFirstOut.analyzer.js';
import { geoDelayedStartLastInAnalyzer } from '@/analyzers/geoDelayedStartLastIn.analyzer.js';
import { geoEarlyStartFirstOutAnalyzer } from '@/analyzers/geoEarlyStartFirstOut.analyzer.js';
import { geoEarlyStartLastInAnalyzer } from '@/analyzers/geoEarlyStartLastIn.analyzer.js';
import { highestVehicleEventDelayAnalyzer } from '@/analyzers/highestVehicleEventDelay.analyzer.js';
import { lessThanTenVehicleEventsAnalyzer } from '@/analyzers/lessThanTenVehicleEvents.analyzer.js';
import { matchingLocationTransactionsAnalyzer } from '@/analyzers/matchingLocationTransactions.analyzer.js';
import { simpleDelayedStartFirstForNextStopAnalyzer } from '@/analyzers/simpleDelayedStartFirstForNextStop.analyzer.js';
import { simpleDelayedStartLastForFirstStopAnalyzer } from '@/analyzers/simpleDelayedStartLastForFirstStop.analyzer.js';
import { simpleEarlyStartFirstForNextStopAnalyzer } from '@/analyzers/simpleEarlyStartFirstForNextStop.analyzer.js';
import { simpleEarlyStartLastForFirstStopAnalyzer } from '@/analyzers/simpleEarlyStartLastForFirstStop.analyzer.js';
import { simpleOneValidationTransactionAnalyzer } from '@/analyzers/simpleOneValidationTransaction.analyzer.js';
import { simpleOneVehicleEventOrValidationTransactionAnalyzer } from '@/analyzers/simpleOneVehicleEventOrValidationTransaction.analyzer.js';
import { simpleThreeVehicleEventsAnalyzer } from '@/analyzers/simpleThreeVehicleEvents.analyzer.js';

/* * */

function runAnalyzers(analysisData: AnalysisData): RideAnalysis[] {
	return [

		/* * * * */

		atMostTwoDriverIdsAnalyzer(analysisData),

		atMostTwoVehicleIdsAnalyzer(analysisData),

		//

		excessiveVehicleEventDelayAnalyzer(analysisData),

		highestVehicleEventDelayAnalyzer(analysisData),

		lessThanTenVehicleEventsAnalyzer(analysisData),

		//

		matchingLocationTransactionsAnalyzer(analysisData),

		//

		geoDelayedStartLastInAnalyzer(analysisData),

		geoDelayedStartFirstOutAnalyzer(analysisData),

		geoEarlyStartLastInAnalyzer(analysisData),

		geoEarlyStartFirstOutAnalyzer(analysisData),

		//

		simpleDelayedStartLastForFirstStopAnalyzer(analysisData),

		simpleDelayedStartFirstForNextStopAnalyzer(analysisData),

		simpleEarlyStartFirstForNextStopAnalyzer(analysisData),

		simpleEarlyStartLastForFirstStopAnalyzer(analysisData),

		//

		simpleOneVehicleEventOrValidationTransactionAnalyzer(analysisData),

		simpleOneValidationTransactionAnalyzer(analysisData),

		simpleThreeVehicleEventsAnalyzer(analysisData),

		/* * * * */

	];
}

/* * */

export async function validateRides() {
	try {
		//

		LOGGER.init();

		const globalTimer = new TIMETRACKER();

		//
		// Ask the coordinator for a batch of ride IDs to process

		const fetchCoordinatorTimer = new TIMETRACKER();

		const rideIdsBatchResponse = await fetch(process.env.MONITOR_COORDINATOR_URL);
		const rideIdsBatch = await rideIdsBatchResponse.json();

		const fetchCoordinatorTimerResult = fetchCoordinatorTimer.get();

		//
		// With the list of ride IDs, fetch the actual ride documents to be processsed

		const fetchRideDocumentsTimer = new TIMETRACKER();

		const ridesBatch = await rides.findMany({ _id: { $in: rideIdsBatch } });

		LOGGER.info(`Processing ${ridesBatch.length} rides... (coordinator: ${fetchCoordinatorTimerResult} | interface: ${fetchRideDocumentsTimer.get()})`);
		LOGGER.spacer(1);

		//
		// Process each ride

		for (const [rideIndex, rideData] of ridesBatch.entries()) {
			try {
				//

				const rideAnalysisTimer = new TIMETRACKER();

				//
				// For this ride, fetch all the necessary data for analysis.
				// This includes static data, like hashed shapes and trips, and dynamic data,
				// like vehicle events and apex transactions. Request all data in parallel.

				const fetchAnalysisDataTimer = new TIMETRACKER();

				const hashedShapePromise = hashedShapes.findById(rideData.hashed_shape_id);
				const hashedTripPromise = hashedTrips.findById(rideData.hashed_trip_id);
				const apexT11Promise = apexT11.findMany({ operational_date: rideData.operational_date, trip_id: rideData.trip_id });
				const apexT19Promise = apexT19.findMany({ operational_date: rideData.operational_date, trip_id: rideData.trip_id });
				const vehicleEventsPromise = vehicleEvents.findMany({ extra_trip_id: null, operational_date: rideData.operational_date, trip_id: rideData.trip_id });

				const [hashedShapeData, hashedTripData, apexT11Data, apexT19Data, vehicleEventsData] = await Promise.all([hashedShapePromise, hashedTripPromise, apexT11Promise, apexT19Promise, vehicleEventsPromise]);

				const fetchAnalysisDataTime = fetchAnalysisDataTimer.get();

				// const fetchHashedShapeDataTimer = new TIMETRACKER();
				// const hashedShapeData = await hashedShapes.findById(rideData.hashed_shape_id);
				// const fetchHashedShapeDataTime = fetchHashedShapeDataTimer.get();

				// const fetchHashedTripDataTimer = new TIMETRACKER();
				// const hashedTripData = await hashedTrips.findById(rideData.hashed_trip_id);
				// const fetchHashedTripDataTime = fetchHashedTripDataTimer.get();

				// const fetchApexT11DataTimer = new TIMETRACKER();
				// const apexT11Data = await apexT11.findMany({ operational_date: rideData.operational_date, trip_id: rideData.trip_id });
				// const fetchApexT11DataTime = fetchApexT11DataTimer.get();

				// const fetchApexT19DataTimer = new TIMETRACKER();
				// const apexT19Data = await apexT19.findMany({ operational_date: rideData.operational_date, trip_id: rideData.trip_id });
				// const fetchApexT19DataTime = fetchApexT19DataTimer.get();

				// const fetchVehicleEventsDataTimer = new TIMETRACKER();
				// const vehicleEventsData = await vehicleEvents.findMany({ operational_date: rideData.operational_date, trip_id: rideData.trip_id });
				// const fetchVehicleEventsDataTime = fetchVehicleEventsDataTimer.get();

				//
				// Augment the current Ride with additional information retrieved
				// from the fetched dynamic data. Some of this data will be used by the analyzers.

				const detectedStartEvent = detectStartEvent(hashedTripData.path, vehicleEventsData);
				const detectedEndEvent = detectEndEvent(hashedTripData.path, vehicleEventsData);

				rideData.start_time_observed = detectedStartEvent?.created_at || null;
				rideData.end_time_observed = detectedEndEvent?.created_at || null;

				rideData.extension_observed = getObservedExtension(detectedStartEvent, detectedEndEvent);

				const detectedFirstEvent = detectFirstEvent(vehicleEventsData);
				const detectedLastEvent = detectLastEvent(vehicleEventsData);

				rideData.seen_first_at = detectedFirstEvent?.created_at || null;
				rideData.seen_last_at = detectedLastEvent?.created_at || null;

				rideData.driver_ids = Array.from(new Set(vehicleEventsData.map(item => item.driver_id).filter(Boolean)));
				rideData.vehicle_ids = Array.from(new Set(vehicleEventsData.map(item => item.vehicle_id).filter(Boolean)));
				rideData.validations_count = apexT11Data.filter(item => ALLOWED_VALIDATION_STATUSES.includes(item.validation_status)).length;

				//
				// Run the analyzers and count how many passed,
				// how many failed and how many errored.

				rideData.analysis = runAnalyzers({
					apex_t11: apexT11Data,
					apex_t19: apexT19Data,
					hashed_shape: hashedShapeData,
					hashed_trip: hashedTripData,
					ride: rideData,
					vehicle_events: vehicleEventsData,
				});

				const passAnalysisCount = rideData.analysis.filter(item => item.grade === 'pass');
				const failAnalysisCount = rideData.analysis.filter(item => item.grade === 'fail');
				const errorAnalysisCount = rideData.analysis.filter(item => item.grade === 'error').map(item => item._id);

				//
				// Update the current Ride with the analysis result
				// and 'complete' status to indicate that the ride has been processed.

				await rides.updateById(
					rideData._id,
					{
						analysis: rideData.analysis,
						driver_ids: rideData.driver_ids,
						end_time_observed: rideData.end_time_observed,
						extension_observed: rideData.extension_observed,
						seen_first_at: rideData.seen_first_at,
						seen_last_at: rideData.seen_last_at,
						start_time_observed: rideData.start_time_observed,
						status: 'complete',
						validations_count: rideData.validations_count,
						vehicle_ids: rideData.vehicle_ids,
					},
				);

				LOGGER.success(`[${rideIndex + 1}/${ridesBatch.length}] ${rideData._id} (fetch: ${fetchAnalysisDataTime} | total: ${rideAnalysisTimer.get()}) | PASS: ${passAnalysisCount.length} | FAIL: ${failAnalysisCount.length} | ERROR: ${errorAnalysisCount.length} [${errorAnalysisCount.join('|')}]`);
				// LOGGER.success(`[${counter}] | ${rideData._id} (fetchHashedShape: ${fetchHashedShapeDataTime} | fetchHashedTrip: ${fetchHashedTripDataTime} | fetchApexT11: ${fetchApexT11DataTime} | fetchApexT19: ${fetchApexT19DataTime} | fetchVehicleEvents: ${fetchVehicleEventsDataTime} | total: ${rideAnalysisTimer.get()}) | PASS: ${passAnalysisCount.length} | FAIL: ${failAnalysisCount.length} | ERROR: ${errorAnalysisCount.length} [${errorAnalysisCount.join('|')}]`);

				//
			}
			catch (error) {
				await rides.updateById(rideData._id, { status: 'error' });
				LOGGER.error('An error occurred while processing a ride.', error);
			}
		}

		//

		LOGGER.terminate(`Run took ${globalTimer.get()}.`);

		//
	}
	catch (err) {
		LOGGER.error('An error occurred. Halting execution.', err);
		LOGGER.error('Retrying in 10 seconds...');
		setTimeout(() => {
			process.exit(0); // End process
		}, 10000); // after 10 seconds
	}

	//
};
