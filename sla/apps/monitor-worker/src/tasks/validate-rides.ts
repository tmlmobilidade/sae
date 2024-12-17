/* * */

import { AnalysisData } from '@/types/analysis-data.type.js';
import { detectEndEvent } from '@/utils/detect-end-event.util.js';
import { detectStartEvent } from '@/utils/detect-start-event.util.js';
import { getObservedExtension } from '@/utils/get-observed-extension.util.js';
import { sortByDate } from '@/utils/sort-by-date.util.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { apexT11, apexT19, hashedShapes, hashedTrips, rides, vehicleEvents } from '@tmlmobilidade/services/interfaces';
import { ALLOWED_VALIDATION_STATUSES, RideAnalysis } from '@tmlmobilidade/services/types';

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
				const vehicleEventsPromise = vehicleEvents.findMany({ operational_date: rideData.operational_date, trip_id: rideData.trip_id });

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
				// Prepare the necessary objects from all the data fetched.
				// These will be used by the analyzers to perform their checks
				// as well as to augment the current Ride with additional information.

				const sortedApexT11 = sortByDate(apexT11Data, 'created_at', 'asc');
				const sortedApexT19 = sortByDate(apexT19Data, 'created_at', 'asc');
				const sortedVehicleEvents = sortByDate(vehicleEventsData, 'created_at', 'asc');

				//
				// Augment the current Ride with additional information retrieved
				// from the fetched dynamic data. Some of this data will be used by the analyzers.

				const detectedStartEvent = detectStartEvent(hashedTripData.path, sortedVehicleEvents);
				const detectedEndEvent = detectEndEvent(hashedTripData.path, sortedVehicleEvents);

				rideData.start_time_observed = detectedStartEvent?.created_at || null;
				rideData.end_time_observed = detectedEndEvent?.created_at || null;

				rideData.extension_observed = getObservedExtension(detectedStartEvent, detectedEndEvent);

				rideData.seen_first_at = sortedVehicleEvents[0].created_at;
				rideData.seen_last_at = sortedVehicleEvents[sortedVehicleEvents.length - 1].created_at;

				rideData.driver_ids = Array.from(new Set(sortedVehicleEvents.map(item => item.driver_id)));
				rideData.vehicle_ids = Array.from(new Set(sortedVehicleEvents.map(item => item.vehicle_id)));
				rideData.validations_count = sortedApexT11.filter(item => ALLOWED_VALIDATION_STATUSES.includes(item.validation_status)).length;

				//
				// Run the analyzers and count how many passed,
				// how many failed and how many errored.

				const analysisResult = runAnalyzers({
					apex_t11: sortedApexT11,
					apex_t19: sortedApexT19,
					hashed_shape: hashedShapeData,
					hashed_trip: hashedTripData,
					ride: rideData,
					vehicle_events: sortedVehicleEvents,
				});

				const passAnalysisCount = analysisResult.filter(item => item.grade === 'pass');
				const failAnalysisCount = analysisResult.filter(item => item.grade === 'fail');
				const errorAnalysisCount = analysisResult.filter(item => item.grade === 'error').map(item => item._id);

				//
				// Update the current Ride with the analysis result
				// and 'complete' status to indicate that the ride has been processed.

				await rides.updateById(rideData._id, { analysis: analysisResult, status: 'complete' });

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
