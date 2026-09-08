/* * */

import { type RideAnalysesRegistry } from '@tmlmobilidade/go-types-operation';

import { atLeastOneVehicleEventOnFirstStopAnalyzer } from '../analyzers/at-least-one-vehicle-event-on-first-stop.js';
import { atLeastOneVehicleEventOnLastStopAnalyzer } from '../analyzers/at-least-one-vehicle-event-on-last-stop.js';
import { expectedApexValidationIntervalAnalyzer } from '../analyzers/expected-apex-validation-interval.js';
import { expectedDriverIdQtyAnalyzer } from '../analyzers/expected-driver-id-qty.js';
import { expectedStartTimeAnalyzer } from '../analyzers/expected-start-time.js';
import { expectedVehicleEventCoverageGeoAnalyzer } from '../analyzers/expected-vehicle-event-coverage-geo.js';
import { expectedVehicleEventDelayAnalyzer } from '../analyzers/expected-vehicle-event-delay.js';
import { expectedVehicleEventIntervalAnalyzer } from '../analyzers/expected-vehicle-event-interval.js';
import { expectedVehicleEventQtyAnalyzer } from '../analyzers/expected-vehicle-event-qty.js';
import { expectedVehicleIdQtyAnalyzer } from '../analyzers/expected-vehicle-id-qty.js';
import { matchingApexLocationsAnalyzer } from '../analyzers/matching-apex-locations.js';
import { matchingVehicleIdsAnalyzer } from '../analyzers/matching-vehicle-ids.js';
import { simpleOneApexValidationAnalyzer } from '../analyzers/simple-one-apex-validation.js';
import { simpleOneVehicleEventOrApexValidationAnalyzer } from '../analyzers/simple-one-vehicle-event-or-apex-validation.js';
import { simpleThreeVehicleEventsAnalyzer } from '../analyzers/simple-three-vehicle-events.js';
import { transactionSequentialityAnalyzer } from '../analyzers/transaction-sequentiality.js';
import { type AnalysisData } from '../types/analysis-data.js';

/* * */

interface AnalyzeRideMetrics {
	error: (keyof RideAnalysesRegistry)[]
	fail: (keyof RideAnalysesRegistry)[]
	pass: (keyof RideAnalysesRegistry)[]
	skip: (keyof RideAnalysesRegistry)[]
}

/**
 * Analyzes the ride data and returns the analysis results.
 * @param analysisData The analysis data to use for the analysis.
 * @returns The analysis results for the ride.
 */
export function analyzeRide(analysisData: AnalysisData): RideAnalysesRegistry {
	// Run each analyzer and store the results
	const analyses: RideAnalysesRegistry = {
		at_least_one_vehicle_event_on_first_stop: atLeastOneVehicleEventOnFirstStopAnalyzer(analysisData),
		at_least_one_vehicle_event_on_last_stop: atLeastOneVehicleEventOnLastStopAnalyzer(analysisData),
		expected_apex_validation_interval: expectedApexValidationIntervalAnalyzer(analysisData),
		expected_driver_id_qty: expectedDriverIdQtyAnalyzer(analysisData),
		expected_start_time: expectedStartTimeAnalyzer(analysisData),
		expected_vehicle_event_coverage_geo: expectedVehicleEventCoverageGeoAnalyzer(analysisData),
		expected_vehicle_event_delay: expectedVehicleEventDelayAnalyzer(analysisData),
		expected_vehicle_event_interval: expectedVehicleEventIntervalAnalyzer(analysisData),
		expected_vehicle_event_qty: expectedVehicleEventQtyAnalyzer(analysisData),
		expected_vehicle_id_qty: expectedVehicleIdQtyAnalyzer(analysisData),
		matching_apex_locations: matchingApexLocationsAnalyzer(analysisData),
		matching_vehicle_ids: matchingVehicleIdsAnalyzer(analysisData),
		simple_one_apex_validation: simpleOneApexValidationAnalyzer(analysisData),
		simple_one_vehicle_event_or_apex_validation: simpleOneVehicleEventOrApexValidationAnalyzer(analysisData),
		simple_three_vehicle_events: simpleThreeVehicleEventsAnalyzer(analysisData),
		transaction_sequentiality: transactionSequentialityAnalyzer(analysisData),
	};
	// Setup a metrics object to track the results of the analyzers
	const metrics: AnalyzeRideMetrics = { error: [], fail: [], pass: [], skip: [] };
	// Update the metrics based on the analysis results
	for (const analysisKey of Object.keys(analyses) as (keyof RideAnalysesRegistry)[]) {
		// Get the analysis result
		const analysisResult = analyses[analysisKey];
		// Update the metrics based on the analysis result
		if (analysisResult.grade_status === 'error') metrics.error.push(analysisKey);
		else if (analysisResult.grade_status === 'fail') metrics.fail.push(analysisKey);
		else if (analysisResult.grade_status === 'pass') metrics.pass.push(analysisKey);
		else if (analysisResult.grade_status === 'skip') metrics.skip.push(analysisKey);
	}

	// Return the analyses
	return analyses;
}
