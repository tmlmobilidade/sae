/* * */

import { AnalysisData } from '@/types/analysis-data.type.js';
import { sortByDate } from '@/utils/sort-by-date.util.js';
import { RideAnalysis } from '@tmlmobilidade/core/types';
import { DateTime } from 'luxon';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'AVG_INTERVAL_VEHICLE_EVENTS'
	reason: 'AVG_INTERVAL_HIGHER_THAN_20_SECONDS' | 'AVG_INTERVAL_LOWER_THAN_OR_EQUAL_TO_20_SECONDS' | 'NO_VEHICLE_EVENTS_FOUND'
	unit: 'AVG_INTERVAL_VEHICLE_EVENTS_MILLISECONDS'
};

/**
 * This analyzer tests if the average interval between vehicle events is within limits.
 *
 * GRADES:
 * → PASS = Average interval between Vehicle events is less than or equal to 20 seconds.
 * → FAIL = Average interval between Vehicle events is higher than 20 seconds.
 */
export function avgIntervalVehicleEvents(analysisData: AnalysisData): ExplicitRideAnalysis {
	try {
		//

		//
		// Return a fail grade if there are no vehicle events

		if (analysisData.vehicle_events.length === 0) {
			return {
				_id: 'AVG_INTERVAL_VEHICLE_EVENTS',
				grade: 'fail',
				message: 'No vehicle events found.',
				reason: 'NO_VEHICLE_EVENTS_FOUND',
				unit: null,
				value: null,
			};
		}

		//
		// Sort vehicle events by created_at timestamp

		const sortedVehicleEvents = sortByDate(analysisData.vehicle_events, 'created_at', 'asc');

		//
		// Evaluate each vehicle event

		let totalIntervalBetweenEvents = 0;

		let previousEventTimestamp = DateTime.fromJSDate(sortedVehicleEvents[0].created_at);

		for (const vehicleEvent of sortedVehicleEvents) {
			//
			const vehicleTimestamp = DateTime.fromJSDate(vehicleEvent.created_at);
			//
			const delayInMilliseconds = vehicleTimestamp.toMillis() - previousEventTimestamp.toMillis();
			//
			totalIntervalBetweenEvents += delayInMilliseconds;
			//
			previousEventTimestamp = vehicleTimestamp;
			//
		}

		//
		// Calculate the average interval between vehicle events

		const avgIntervalBetweenEvents = totalIntervalBetweenEvents / analysisData.vehicle_events.length;

		if (avgIntervalBetweenEvents <= 20000) {
			return {
				_id: 'AVG_INTERVAL_VEHICLE_EVENTS',
				grade: 'pass',
				message: 'Average interval between events is within limits.',
				reason: 'AVG_INTERVAL_LOWER_THAN_OR_EQUAL_TO_20_SECONDS',
				unit: 'AVG_INTERVAL_VEHICLE_EVENTS_MILLISECONDS',
				value: avgIntervalBetweenEvents,
			};
		}

		return {
			_id: 'AVG_INTERVAL_VEHICLE_EVENTS',
			grade: 'fail',
			message: 'Average interval between events is higher than limit.',
			reason: 'AVG_INTERVAL_HIGHER_THAN_20_SECONDS',
			unit: 'AVG_INTERVAL_VEHICLE_EVENTS_MILLISECONDS',
			value: avgIntervalBetweenEvents,
		};

		//
	}
	catch (error) {
		return {
			_id: 'AVG_INTERVAL_VEHICLE_EVENTS',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
