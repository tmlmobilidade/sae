/* * */

import { type RideAnalysisExpectedVehicleEventCoverageGeo, RideAnalysisExpectedVehicleEventCoverageGeoSchema, RideAnalysisExpectedVehicleEventDelaySchema } from '@tmlmobilidade/go-types-operation';
import { Dates } from '@tmlmobilidade/go-utils-dates';

import { type AnalysisData } from '../types/analysis-data.js';

/* * */

/**
 * This analyzer tests if at least 90% of all stops are covered by at least one vehicle event,
 * using the GPS coordinates of the vehicle events and the geofences of the stops.
 *
 * GRADES:
 * → PASS = At least 90% of all stops are covered by at least one vehicle event.
 * → FAIL = Less than 90% of all stops are covered by at least one vehicle event.
 */
export function expectedVehicleEventCoverageGeoAnalyzer(analysisData: AnalysisData): RideAnalysisExpectedVehicleEventCoverageGeo {
	try {
		//

		if (!analysisData.vehicle_events.length) {
			return RideAnalysisExpectedVehicleEventCoverageGeoSchema.parse({
				agency_id: analysisData.ride.agency_id,
				grade_status: 'skip',
				operational_date: analysisData.ride.operational_date,
				reason: 'NO_VEHICLE_EVENTS',
				remarks: null,
				ride_id: analysisData.ride._id,
				stops_coverage_absolute: null,
				stops_coverage_percentage: null,
				updated_at: Dates.now('utc').unix_milliseconds,
			});
		}

		//
		// Evaluate each vehicle event

		let countOfEventsWithDelay = 0;
		let totalDelay = 0;
		let minDelay = Infinity;
		let maxDelay = -Infinity;

		for (const vehicleEvent of analysisData.vehicle_events) {
			const delayInMilliseconds = vehicleEvent.received_at - vehicleEvent.created_at;
			totalDelay += delayInMilliseconds;
			minDelay = Math.min(minDelay, delayInMilliseconds);
			maxDelay = Math.max(maxDelay, delayInMilliseconds);
			if (delayInMilliseconds >= MAX_DELAY_IN_MILLISECONDS) countOfEventsWithDelay++;
		}

		//
		// Calculate delay metrics

		const averageDelay = totalDelay / analysisData.vehicle_events.length;
		const delayPercentage = (countOfEventsWithDelay / analysisData.vehicle_events.length) * 100;

		//
		// Return the result

		if (countOfEventsWithDelay > 0) {
			return RideAnalysisExpectedVehicleEventDelaySchema.parse({
				agency_id: analysisData.ride.agency_id,
				grade_status: 'fail',
				observed_average_delay: averageDelay,
				observed_max_delay: maxDelay,
				observed_min_delay: minDelay,
				operational_date: analysisData.ride.operational_date,
				reason: 'UNEXPECTED_VEHICLE_EVENTS_DELAY',
				remarks: null,
				ride_id: analysisData.ride._id,
				updated_at: Dates.now('utc').unix_milliseconds,
				vehicle_events_qty: analysisData.vehicle_events.length,
				vehicle_events_with_delay_percent: delayPercentage,
				vehicle_events_with_delay_qty: countOfEventsWithDelay,
			});
		}

		return RideAnalysisExpectedVehicleEventDelaySchema.parse({
			agency_id: analysisData.ride.agency_id,
			grade_status: 'pass',
			observed_average_delay: averageDelay,
			observed_max_delay: maxDelay,
			observed_min_delay: minDelay,
			operational_date: analysisData.ride.operational_date,
			reason: 'EXPECTED_VEHICLE_EVENTS_DELAY',
			remarks: null,
			ride_id: analysisData.ride._id,
			updated_at: Dates.now('utc').unix_milliseconds,
			vehicle_events_qty: analysisData.vehicle_events.length,
			vehicle_events_with_delay_percent: delayPercentage,
			vehicle_events_with_delay_qty: countOfEventsWithDelay,
		});

		//
	} catch (error) {
		return RideAnalysisExpectedVehicleEventDelaySchema.parse({
			agency_id: analysisData.ride.agency_id,
			grade_status: 'error',
			observed_average_delay: null,
			observed_max_delay: null,
			observed_min_delay: null,
			operational_date: analysisData.ride.operational_date,
			reason: null,
			remarks: error.message,
			ride_id: analysisData.ride._id,
			updated_at: Dates.now('utc').unix_milliseconds,
			vehicle_events_qty: null,
			vehicle_events_with_delay_percent: null,
			vehicle_events_with_delay_qty: null,
		});
	}
};
