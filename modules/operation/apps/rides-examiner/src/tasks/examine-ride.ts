/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { getRideHash } from '@tmlmobilidade/go-operation-pckg-utils';
import { type Ride, RideSchema } from '@tmlmobilidade/go-types-operation';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { fetchAnalysisData } from '../utils/fetch-analysis-data.js';
import { rideAnalysisAtLeastOneVehicleEventOnFirstStopWriter, rideAnalysisAtLeastOneVehicleEventOnLastStopWriter, rideAnalysisExpectedApexValidationIntervalWriter, rideAnalysisExpectedDriverIdQtyWriter, rideAnalysisExpectedStartTimeWriter, rideAnalysisExpectedVehicleEventDelayWriter, rideAnalysisExpectedVehicleEventIntervalWriter, rideAnalysisExpectedVehicleEventQtyWriter, rideAnalysisExpectedVehicleIdQtyWriter, rideAnalysisMatchingApexLocationsWriter, rideAnalysisMatchingVehicleIdsWriter, rideAnalysisSimpleOneApexValidationWriter, rideAnalysisSimpleOneVehicleEventOrApexValidationWriter, rideAnalysisSimpleThreeVehicleEventsWriter, rideAnalysisTransactionSequentialityWriter, ridesWriter } from '../utils/writers.js';
import { analyzeRide } from './analyze-ride.js';
import { augmentRide } from './augment-ride.js';

/* * */

export async function examineRide(rideData: Ride, index: number, batchSize: number) {
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
		// from the fetched dynamic data. Run the analyzers on the augmented ride data.

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

		const analysesResult = analyzeRide({
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

		//
		// Validate the results and generate a unique hash for this ride.

		const validatedRide = RideSchema.parse({
			...augmentedRideData,
			hash: getRideHash(augmentedRideData),
			processing_status: 'complete',
			updated_at: Dates.now('utc').unix_milliseconds,
		});

		//
		// Perform the update and inserts into GoDB and LabDB.

		await goDb.operation.rides.updateById(rideData._id, validatedRide);

		await ridesWriter.write(validatedRide);

		await rideAnalysisAtLeastOneVehicleEventOnFirstStopWriter.write(analysesResult.at_least_one_vehicle_event_on_first_stop);
		await rideAnalysisAtLeastOneVehicleEventOnLastStopWriter.write(analysesResult.at_least_one_vehicle_event_on_last_stop);
		await rideAnalysisExpectedApexValidationIntervalWriter.write(analysesResult.expected_apex_validation_interval);
		await rideAnalysisExpectedDriverIdQtyWriter.write(analysesResult.expected_driver_id_qty);
		await rideAnalysisExpectedStartTimeWriter.write(analysesResult.expected_start_time);
		await rideAnalysisExpectedVehicleEventDelayWriter.write(analysesResult.expected_vehicle_event_delay);
		await rideAnalysisExpectedVehicleEventIntervalWriter.write(analysesResult.expected_vehicle_event_interval);
		await rideAnalysisExpectedVehicleEventQtyWriter.write(analysesResult.expected_vehicle_event_qty);
		await rideAnalysisExpectedVehicleIdQtyWriter.write(analysesResult.expected_vehicle_id_qty);
		await rideAnalysisMatchingApexLocationsWriter.write(analysesResult.matching_apex_locations);
		await rideAnalysisMatchingVehicleIdsWriter.write(analysesResult.matching_vehicle_ids);
		await rideAnalysisSimpleOneApexValidationWriter.write(analysesResult.simple_one_apex_validation);
		await rideAnalysisSimpleOneVehicleEventOrApexValidationWriter.write(analysesResult.simple_one_vehicle_event_or_apex_validation);
		await rideAnalysisSimpleThreeVehicleEventsWriter.write(analysesResult.simple_three_vehicle_events);
		await rideAnalysisTransactionSequentialityWriter.write(analysesResult.transaction_sequentiality);

		//
		// Run the analyzers and count how many passed,
		// how many failed and how many errored.

		if (!analysesResult) throw new Error(`Analyses object is unavailable for ride after analysis run: ${rideData._id}`);

		const skipAnalysisCount = Object.entries(analysesResult).filter(([, value]) => value.grade_status === 'skip').map(([key]) => key);
		const passAnalysisCount = Object.entries(analysesResult).filter(([, value]) => value.grade_status === 'pass').map(([key]) => key);
		const failAnalysisCount = Object.entries(analysesResult).filter(([, value]) => value.grade_status === 'fail').map(([key]) => key);
		const errorAnalysisCount = Object.entries(analysesResult).filter(([, value]) => value.grade_status === 'error').map(([key]) => key);

		Logger.info({ message: [
			'[', { a: 'right', c: 7, t: `${batchSize - index}/${batchSize}` }, ']',
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
};
