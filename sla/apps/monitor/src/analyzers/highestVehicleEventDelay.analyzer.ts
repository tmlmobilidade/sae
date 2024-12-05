/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { RideAnalysis } from '@tmlmobilidade/services/types';
import { DateTime } from 'luxon';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'HIGHEST_VEHICLE_EVENT_DELAY'
	unit: 'HIGHEST_EVENT_DELAY_IN_MILLISECONDS'
};

/**
 * This analyzer tests for the highest event delay between the vehicle and PCGI.
 *
 * GRADES:
 * → PASS = Delay between Vehicle and PCGI timestamps is less than 10 seconds.
 * → FAIL = Delay between Vehicle and PCGI timestamps is equal to or higher than 10 seconds.
 */
export function highestVehicleEventDelayAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
	try {
		//

		// 1.
		// Initiate a counting variable

		let highestEventDelaySoFar = 0;

		// 2.
		// Evaluate each vehicle event

		for (const vehicleEvent of analysisData.vehicle_events) {
			//
			const insertTimestamp = DateTime.fromJSDate(vehicleEvent.insert_timestamp).toMillis();
			const vehicleTimestamp = DateTime.fromJSDate(vehicleEvent.vehicle_timestamp).toMillis();
			//
			const delayInMilliseconds = insertTimestamp - vehicleTimestamp;
			//
			if (delayInMilliseconds > highestEventDelaySoFar) {
				highestEventDelaySoFar = delayInMilliseconds;
			}
			//
		}

		return {
			_id: 'HIGHEST_VEHICLE_EVENT_DELAY',
			grade: 'pass',
			message: null,
			reason: null,
			unit: 'HIGHEST_EVENT_DELAY_IN_MILLISECONDS',
			value: highestEventDelaySoFar,
		};

		//
	}
	catch (error) {
		return {
			_id: 'HIGHEST_VEHICLE_EVENT_DELAY',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
