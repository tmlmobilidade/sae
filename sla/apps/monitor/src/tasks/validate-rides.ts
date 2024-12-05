/* * */

import type { AnalysisData } from '@/types/analysisData.type.js';
import type { RideAnalysis } from '@tmlmobilidade/services/types';

import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { hashedShapes, hashedTrips, rides, vehicleEvents } from '@tmlmobilidade/services/interfaces';
import { DateTime } from 'luxon';

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

const BATCH_SIZE = 1000;

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
		// Get all rides that are pending analysis and which started before the current time,
		// sorted in descending order to prioritize the most recent rides

		const currentTime = DateTime.now().setZone('Europe/Lisbon').toJSDate();

		const ridesCollection = await rides.getCollection();

		const allPendingRides = ridesCollection
			.find({ start_time_scheduled: { $lte: currentTime }, status: 'pending' })
			.sort({ start_time_scheduled: -1 })
			.limit(BATCH_SIZE)
			.stream();

		//
		// Process each ride

		let counter = 0;

		for await (const rideDocument of allPendingRides) {
			try {
				//

				counter++;

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
					sales: [],
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

				await rides.updateById(rideDocument._id, { analysis: analysisResult, status: 'complete' });

				LOGGER.success(`[${counter}] | ${rideDocument._id} (${rideAnalysisTimer.get()}) | PASS: ${passAnalysisCount.length} | FAIL: ${failAnalysisCount.length} | ERROR: ${errorAnalysisCount.length} [${errorAnalysisCount.join('|')}]`);

				//
			}
			catch (error) {
				await rides.updateById(rideDocument._id, { status: 'error' });
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
