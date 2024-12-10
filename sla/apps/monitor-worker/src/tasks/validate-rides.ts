/* * */

import { AnalysisData } from '@/types/analysis-data.type.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { apexT11, apexT19, hashedShapes, hashedTrips, rides, vehicleEvents } from '@tmlmobilidade/services/interfaces';
import { RideAnalysis, ValidationStatus } from '@tmlmobilidade/services/types';

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
				// Await all promises

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
				// Prepare the data for analysis

				const analysisData: AnalysisData = {
					apex_t11: apexT11Data,
					apex_t19: apexT19Data,
					hashed_shape: hashedShapeData,
					hashed_trip: hashedTripData,
					ride: rideData,
					vehicle_events: vehicleEventsData,
				};

				//
				// Run the analyzers

				const analysisResult = runAnalyzers(analysisData);

				//
				// Count how many analysis passed and how many failed

				const passAnalysisCount = analysisResult.filter(item => item.grade === 'pass');

				const failAnalysisCount = analysisResult.filter(item => item.grade === 'fail');

				const errorAnalysisCount = analysisResult.filter(item => item.grade === 'error').map(item => item._id);

				//
				// Populate Ride with additional data

				rideData.driver_ids = Array.from(new Set(vehicleEventsData.map(item => item.driver_id)));
				rideData.vehicle_ids = Array.from(new Set(vehicleEventsData.map(item => item.vehicle_id)));
				rideData.validations_count = apexT11Data.filter(item => item.validation_status === ValidationStatus._0_ContractValid || item.validation_status === ValidationStatus._4_CardInWhiteList || item.validation_status === ValidationStatus._5_ProfileInWhiteList || item.validation_status === ValidationStatus._6_Interchange).length;

				//
				// Update trip with analysis result and status

				await rides.updateById(rideData._id, { analysis: analysisResult, status: 'complete' });

				LOGGER.success(`[${rideIndex}/${ridesBatch.length}] ${rideData._id} (fetch: ${fetchAnalysisDataTime} | total: ${rideAnalysisTimer.get()}) | PASS: ${passAnalysisCount.length} | FAIL: ${failAnalysisCount.length} | ERROR: ${errorAnalysisCount.length} [${errorAnalysisCount.join('|')}]`);
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
