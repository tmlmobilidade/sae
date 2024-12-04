/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

import atMostTwoDriverIdsAnalyzer from '@/analyzers/atMostTwoDriverIds.analyzer.js';
import atMostTwoVehicleIdsAnalyzer from '@/analyzers/atMostTwoVehicleIds.analyzer.js';
import excessiveVehicleEventDelayAnalyzer from '@/analyzers/excessiveVehicleEventDelay.analyzer.js';
import geoDelayedStartFiveMinutesFirstOutAnalyzer from '@/analyzers/geoDelayedStartFiveMinutesFirstOut.analyzer.js';
import geoDelayedStartFiveMinutesLastInAnalyzer from '@/analyzers/geoDelayedStartFiveMinutesLastIn.analyzer.js';
import geoDelayedStartTenMinutesFirstOutAnalyzer from '@/analyzers/geoDelayedStartTenMinutesFirstOut.analyzer.js';
import geoDelayedStartTenMinutesLastInAnalyzer from '@/analyzers/geoDelayedStartTenMinutesLastIn.analyzer.js';
import geoDelayedStartThreeMinutesFirstOutAnalyzer from '@/analyzers/geoDelayedStartThreeMinutesFirstOut.analyzer.js';
import geoDelayedStartThreeMinutesLastInAnalyzer from '@/analyzers/geoDelayedStartThreeMinutesLastIn.analyzer.js';
import geoEarlyStartFirstOutAnalyzer from '@/analyzers/geoEarlyStartFirstOut.analyzer.js';
import geoEarlyStartLastInAnalyzer from '@/analyzers/geoEarlyStartLastIn.analyzer.js';
import highestVehicleEventDelayAnalyzer from '@/analyzers/highestVehicleEventDelay.analyzer.js';
import lessThanTenVehicleEventsAnalyzer from '@/analyzers/lessThanTenVehicleEvents.analyzer.js';
import matchingLocationTransactionsAnalyzer from '@/analyzers/matchingLocationTransactions.analyzer.js';
import simpleDelayedStartFiveMinutesFirstForNextStopAnalyzer from '@/analyzers/simpleDelayedStartFiveMinutesFirstForNextStop.analyzer.js';
import simpleDelayedStartFiveMinutesLastForFirstStopAnalyzer from '@/analyzers/simpleDelayedStartFiveMinutesLastForFirstStop.analyzer.js';
import simpleDelayedStartTenMinutesFirstForNextStopAnalyzer from '@/analyzers/simpleDelayedStartTenMinutesFirstForNextStop.analyzer.js';
import simpleDelayedStartTenMinutesLastForFirstStopAnalyzer from '@/analyzers/simpleDelayedStartTenMinutesLastForFirstStop.analyzer.js';
import simpleDelayedStartThreeMinutesFirstForNextStopAnalyzer from '@/analyzers/simpleDelayedStartThreeMinutesFirstForNextStop.analyzer.js';
import simpleDelayedStartThreeMinutesLastForFirstStopAnalyzer from '@/analyzers/simpleDelayedStartThreeMinutesLastForFirstStop.analyzer.js';
import simpleEarlyStartFirstForNextStopAnalyzer from '@/analyzers/simpleEarlyStartFirstForNextStop.analyzer.js';
import simpleEarlyStartLastForFirstStopAnalyzer from '@/analyzers/simpleEarlyStartLastForFirstStop.analyzer.js';
import simpleOneValidationTransactionAnalyzer from '@/analyzers/simpleOneValidationTransaction.analyzer.js';
import simpleOneVehicleEventOrValidationTransactionAnalyzer from '@/analyzers/simpleOneVehicleEventOrValidationTransaction.analyzer.js';
import simpleThreeVehicleEventsAnalyzer from '@/analyzers/simpleThreeVehicleEvents.analyzer.js';
import { hashedShapes, hashedTrips, rides, vehicleEvents } from '@tmlmobilidade/services/interfaces';
import { RideAnalysis } from '@tmlmobilidade/services/types';
import { DateTime } from 'luxon';

/* * */

const BATCH_SIZE = 500;

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

		geoDelayedStartThreeMinutesLastInAnalyzer(analysisData),

		geoDelayedStartThreeMinutesFirstOutAnalyzer(analysisData),

		geoDelayedStartFiveMinutesLastInAnalyzer(analysisData),

		geoDelayedStartFiveMinutesFirstOutAnalyzer(analysisData),

		geoDelayedStartTenMinutesLastInAnalyzer(analysisData),

		geoDelayedStartTenMinutesFirstOutAnalyzer(analysisData),

		geoEarlyStartLastInAnalyzer(analysisData),

		geoEarlyStartFirstOutAnalyzer(analysisData),

		//

		simpleDelayedStartThreeMinutesLastForFirstStopAnalyzer(analysisData),

		simpleDelayedStartThreeMinutesFirstForNextStopAnalyzer(analysisData),

		simpleDelayedStartFiveMinutesLastForFirstStopAnalyzer(analysisData),

		simpleDelayedStartFiveMinutesFirstForNextStopAnalyzer(analysisData),

		simpleDelayedStartTenMinutesLastForFirstStopAnalyzer(analysisData),

		simpleDelayedStartTenMinutesFirstForNextStopAnalyzer(analysisData),

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
		// Get all rides that are pending analysis and which started before the current time,
		// sorted in descending order to prioritize the most recent rides

		const currentUnixTime = DateTime.now().setZone('Europe/Lisbon').toUnixInteger();

		console.log(currentUnixTime);

		const ridesCollection = await rides.getCollection();

		const allPendingRides = ridesCollection
			.find({ start_time_scheduled_unix: { $lte: currentUnixTime }, status: 'pending' })
			.sort({ start_time_scheduled_unix: -1 })
			.limit(BATCH_SIZE)
			.stream();

		//
		// Process each ride

		for await (const rideDocument of allPendingRides) {
			try {
				//

				const rideAnalysisTimer = new TIMETRACKER();

				await rides.updateById(rideDocument._id, { status: 'processing' });

				const hashedShapeData = await hashedShapes.findById(rideDocument.hashed_shape_id);
				const hashedTripData = await hashedTrips.findById(rideDocument.hashed_trip_id);
				const vehicleEventsData = await vehicleEvents.findMany({ operational_date: rideDocument.operational_date, trip_id: rideDocument.trip_id });

				//

				const analysisData: AnalysisData = {
					hashed_shape: hashedShapeData,
					hashed_trip: hashedTripData,
					location_transactions: [],
					ride: rideDocument,
					validation_transactions: [],
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
				// Update trip with analysis result and status

				await rides.updateById(rideDocument._id, { status: 'complete' });

				LOGGER.success(`${rideDocument._id} (${rideAnalysisTimer.get()}) | PASS: ${passAnalysisCount.length} | FAIL: ${failAnalysisCount.length} | ERROR: ${errorAnalysisCount.length} [${errorAnalysisCount.join('|')}]`);

				//
			}
			catch (error) {
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
