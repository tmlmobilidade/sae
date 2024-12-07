/* * */

import { AnalysisData } from '@/types/analysis-data.type.js';
import { RideAnalysis } from '@tmlmobilidade/services/types';
import { DateTime } from 'luxon';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'EXCESSIVE_VEHICLE_EVENT_DELAY'
	reason: 'ALL_VEHICLE_EVENTS_ARE_WITHIN_DELAY_LIMITS' | `THERE_ARE_${number}_VEHICLE_EVENTS_WITH_EXCESSIVE_DELAY`
	unit: 'COUNT_OF_VEHICLE_EVENTS_WITH_EXCESSIVE_DELAY'
};

/**
 * This analyzer tests if there are events with excessive delay between the vehicle and PCGI.
 *
 * GRADES:
 * → PASS = Delay between Vehicle and PCGI timestamps is less than 10 seconds.
 * → FAIL = Delay between Vehicle and PCGI timestamps is equal to or higher than 10 seconds.
 */
export function excessiveVehicleEventDelayAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
	try {
		//

		// 1.
		// Initiate a counting variable

		let countOfEventsWithDelay = 0;

		// 2.
		// Evaluate each vehicle event

		for (const vehicleEvent of analysisData.vehicle_events) {
			//
			const insertTimestamp = DateTime.fromJSDate(vehicleEvent.received_at);
			const vehicleTimestamp = DateTime.fromJSDate(vehicleEvent.created_at);
			//
			const delayInMilliseconds = insertTimestamp.toMillis() - vehicleTimestamp.toMillis();
			//
			if (delayInMilliseconds >= 10000) {
				countOfEventsWithDelay++;
			}
			//
		}

		if (countOfEventsWithDelay === 0) {
			return {
				_id: 'EXCESSIVE_VEHICLE_EVENT_DELAY',
				grade: 'pass',
				message: 'All vehicle events are within delay limits.',
				reason: 'ALL_VEHICLE_EVENTS_ARE_WITHIN_DELAY_LIMITS',
				unit: 'COUNT_OF_VEHICLE_EVENTS_WITH_EXCESSIVE_DELAY',
				value: 0,
			};
		}

		return {
			_id: 'EXCESSIVE_VEHICLE_EVENT_DELAY',
			grade: 'fail',
			message: `Found ${countOfEventsWithDelay} vehicle events with excessive delay.`,
			reason: `THERE_ARE_${countOfEventsWithDelay}_VEHICLE_EVENTS_WITH_EXCESSIVE_DELAY`,
			unit: 'COUNT_OF_VEHICLE_EVENTS_WITH_EXCESSIVE_DELAY',
			value: countOfEventsWithDelay,
		};

		//
	}
	catch (error) {
		return {
			_id: 'EXCESSIVE_VEHICLE_EVENT_DELAY',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
