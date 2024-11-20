/* * */

import SLAMANAGERBUFFERDB from '@/services/SLAMANAGERBUFFERDB.js';
import SLAMANAGERDB from '@/services/SLAMANAGERDB.js';
import { AnalysisData } from '@/types/analysisData.type.js';
import { AnalysisResultGrade, AnalysisResultStatus } from '@/types/analysisResult.type.js';
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

/* * */

const ANALYSIS_BATCH_SIZE = 2000;

/* * */

function runAnalyzers(analysisData: AnalysisData) {
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

export default async () => {
	try {
		//

		LOGGER.init();

		// 1.
		// Introduce a random delay between 0 and 3 seconds to prevent overlaps with other monitor instances

		// const randomDelay = Math.floor(Math.random() * 3000);
		// LOGGER.info(`Waiting for random delay of ${randomDelay} ms...`);

		// await new Promise(resolve => setTimeout(resolve, randomDelay));

		// 2.
		// Connect to databases

		const globalTimer = new TIMETRACKER();

		LOGGER.info('Connecting to databases...');

		await SLAMANAGERDB.connect();
		await SLAMANAGERBUFFERDB.connect();

		// 3.
		// Get all operational days that are already buffered

		const bufferedOperationalDaysTimer = new TIMETRACKER();

		const bufferedOperationalDays = await SLAMANAGERBUFFERDB.OperationalDayStatus.distinct('operational_day', { location_transaction_synced: true, validation_transaction_synced: true, vehicle_event_synced: true });

		if (bufferedOperationalDays.length === 0) {
			LOGGER.error('No operational days are buffered yet.');
			LOGGER.terminate(`Run took ${globalTimer.get()}.`);
			return;
		}

		LOGGER.info(`There are ${bufferedOperationalDays.length} buffered operational days (${bufferedOperationalDaysTimer.get()})`);

		// 4.
		// Get the first operational day with pending trips

		const selectedOperationalDayTimer = new TIMETRACKER();

		const bufferedOperationalDaysWithPendingTrips = await SLAMANAGERDB.TripAnalysis.distinct('operational_day', { operational_day: { $in: bufferedOperationalDays }, status: 'pending' });

		bufferedOperationalDaysWithPendingTrips.sort((a: string, b: string) => b.localeCompare(a));

		if (bufferedOperationalDaysWithPendingTrips.length === 0) {
			LOGGER.error('There are no pending trips for any buffered operational days.');
			LOGGER.terminate(`Run took ${globalTimer.get()}.`);
			return;
		}

		const selectedBufferedOperationalDay = bufferedOperationalDaysWithPendingTrips[0];

		LOGGER.info(`Selected buffered operational day "${selectedBufferedOperationalDay}" (${selectedOperationalDayTimer.get()})`);

		// 5.
		// Get all trips pending analysis from the selected buffered operational day

		const tripAnalysisBatchTimer = new TIMETRACKER();

		const tripAnalysisBatch = await SLAMANAGERDB.TripAnalysis.find({ operational_day: selectedBufferedOperationalDay, status: 'pending' }).sort({ trip_id: 1 }).limit(ANALYSIS_BATCH_SIZE).toArray();

		if (tripAnalysisBatch.length === 0) {
			LOGGER.error(`No trips are pending analysis for selected buffered operational day "${selectedBufferedOperationalDay}".`);
			LOGGER.terminate(`Run took ${globalTimer.get()}.`);
			return;
		}

		LOGGER.info(`Fetched ${tripAnalysisBatch.length} pending trips for selected operational day "${selectedBufferedOperationalDay}" (${tripAnalysisBatchTimer.get()})`);

		// 6.
		// Mark all trips in the batch as 'processing' to prevent conflicting analysis by other monitor instances

		const markBatchAsProcessingTimer = new TIMETRACKER();

		const tripAnalysisBatchCodes = tripAnalysisBatch.map(item => item.code);
		await SLAMANAGERDB.TripAnalysis.updateMany({ code: { $in: tripAnalysisBatchCodes } }, { $set: { status: 'processing' } });

		LOGGER.info(`Marked ${tripAnalysisBatch.length} trips as "processing" (${markBatchAsProcessingTimer.get()})`);

		// 7.
		// Retrieve associated hashed data for the trips in the batch

		const hashedDataTimer = new TIMETRACKER();

		const tripAnalysisBatchHashedShapeCodes = tripAnalysisBatch.map(item => item.hashed_shape_code);
		const allHashedShapesData = await SLAMANAGERDB.HashedShape.find({ code: { $in: tripAnalysisBatchHashedShapeCodes } }).toArray();
		const hashedShapesDataMap = new Map(allHashedShapesData.map(item => [item.code, item]));

		const tripAnalysisBatchHashedTripCodes = tripAnalysisBatch.map(item => item.hashed_trip_code);
		const allHashedTripsData = await SLAMANAGERDB.HashedTrip.find({ code: { $in: tripAnalysisBatchHashedTripCodes } }).toArray();
		const hashedTripsDataMap = new Map(allHashedTripsData.map(item => [item.code, item]));

		LOGGER.info(`Stored ${allHashedShapesData.length} Hashed Shapes and ${allHashedTripsData.length} Hashed Trips into memory (${hashedDataTimer.get()})`);

		// 8.
		// Retrieve buffer data for the selected operational day and the trips in the batch
		// and build a hashmap for each buffer data type

		const bufferedDataTimer = new TIMETRACKER();

		const tripAnalysisBatchTripIds = tripAnalysisBatch.map(item => item.trip_id);
		const allBufferedDataForCurrentBatch = await SLAMANAGERBUFFERDB.BufferData.find({ operational_day: selectedBufferedOperationalDay, trip_id: { $in: tripAnalysisBatchTripIds } }).toArray();

		const locationTransactionsBufferMap = new Map();
		const validationTransactionsBufferMap = new Map();
		const vehicleEventsBufferMap = new Map();

		for (const bufferDocument of allBufferedDataForCurrentBatch) {
			switch (bufferDocument.type) {
				case 'location_transaction': {
					if (!locationTransactionsBufferMap.has(bufferDocument.trip_id)) {
						locationTransactionsBufferMap.set(bufferDocument.trip_id, []);
					}
					locationTransactionsBufferMap.get(bufferDocument.trip_id).push(JSON.parse(bufferDocument.data));
					break;
				}
				case 'validation_transaction': {
					if (!validationTransactionsBufferMap.has(bufferDocument.trip_id)) {
						validationTransactionsBufferMap.set(bufferDocument.trip_id, []);
					}
					validationTransactionsBufferMap.get(bufferDocument.trip_id).push(JSON.parse(bufferDocument.data));
					break;
				}
				case 'vehicle_event': {
					if (!vehicleEventsBufferMap.has(bufferDocument.trip_id)) {
						vehicleEventsBufferMap.set(bufferDocument.trip_id, []);
					}
					vehicleEventsBufferMap.get(bufferDocument.trip_id).push(JSON.parse(bufferDocument.data));
					break;
				}
			}
		}

		LOGGER.info(`Stored ${allBufferedDataForCurrentBatch.length} buffer documents into memory (${bufferedDataTimer.get()})`);

		// 9.
		// Analyze each trip in the batch

		for (const [tripAnalysisIndex, tripAnalysisData] of tripAnalysisBatch.entries()) {
			//

			const tripAnalysisTimer = new TIMETRACKER();

			// 9.1.
			// Get HashedShape and HashedTrip for this trip

			const hashedShapeData = hashedShapesDataMap.get(tripAnalysisData.hashed_shape_code);
			const hashedTripData = hashedTripsDataMap.get(tripAnalysisData.hashed_trip_code);

			// 9.2.
			// Get transactions and events for this trip

			const allLocationTransactionsData = locationTransactionsBufferMap.get(tripAnalysisData.trip_id) || [];
			const allValidationTransactionsData = validationTransactionsBufferMap.get(tripAnalysisData.trip_id) || [];
			const allVehicleEventsData = vehicleEventsBufferMap.get(tripAnalysisData.trip_id) || [];

			// 9.3.
			// Build the analysis data, common to all analyzers

			const analysisData: AnalysisData = {
				hashed_shape: hashedShapeData,
				hashed_trip: hashedTripData,
				location_transactions: allLocationTransactionsData,
				trip_analysis: tripAnalysisData,
				validation_transactions: allValidationTransactionsData,
				vehicle_events: allVehicleEventsData,
			};

			// 9.4.
			// Run the analyzers

			tripAnalysisData.analysis = runAnalyzers(analysisData);

			// 9.5.
			// Count how many analysis passed and how many failed

			const passAnalysisCount = tripAnalysisData.analysis.filter(item => item.grade === AnalysisResultGrade.PASS);

			const failAnalysisCount = tripAnalysisData.analysis.filter(item => item.grade === AnalysisResultGrade.FAIL);

			const errorAnalysisCount = tripAnalysisData.analysis.filter(item => item.status === AnalysisResultStatus.ERROR).map(item => item.code);

			// 9.6.
			// Update trip with analysis result and status

			tripAnalysisData.status = 'processed';

			await SLAMANAGERDB.TripAnalysis.replaceOne({ code: tripAnalysisData.code }, tripAnalysisData);

			//

			LOGGER.success(`[${tripAnalysisIndex + 1}/${tripAnalysisBatch.length}] | ${tripAnalysisData.code} (${tripAnalysisTimer.get()}) | PASS: ${passAnalysisCount.length} | FAIL: ${failAnalysisCount.length} | ERROR: ${errorAnalysisCount.length} [${errorAnalysisCount.join('|')}]`);

			//
		}

		// 10.
		// Mark all remaining processing trips in the batch as pending
		// This ensures that they will be reprocessed in the next run if something went wrong

		await SLAMANAGERDB.TripAnalysis.updateMany({ code: { $in: tripAnalysisBatchCodes }, status: 'processing' }, { $set: { status: 'pending' } });

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
