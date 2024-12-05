/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { AnalysisResult, AnalysisResultGrade, AnalysisResultStatus } from '@/types/analysisResult.type.js';

/* * */

// This analyzer tests for the highest event delay between the vehicle and PCGI.
//
// GRADES:
// → PASS = Delay between Vehicle and PCGI timestamps is less than 10 seconds.
// → FAIL = Delay between Vehicle and PCGI timestamps is equal to or higher than 10 seconds.

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'HIGHEST_VEHICLE_EVENT_DELAY'
	reason: null
	unit: 'HIGHEST_EVENT_DELAY_IN_MILLISECONDS' | null
	value: null | number
};

/* * */

export function ANALYZERNAME(analysisData: AnalysisData): ExplicitRideAnalysis {
	//

	try {
		//

		// 1.
		// Initiate a counting variable

		let highestEventDelaySoFar = 0;

		// 2.
		// Evaluate each vehicle event

		for (const vehicleEvent of analysisData.vehicle_events) {
			//
			const pcgiTimestamp = vehicleEvent.millis;
			const vehicleTimestamp = vehicleEvent.content.entity[0].vehicle.timestamp * 1000;
			//
			const delayInMilliseconds = pcgiTimestamp - vehicleTimestamp;
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
			status: AnalysisResultStatus.COMPLETE,
			unit: 'HIGHEST_EVENT_DELAY_IN_MILLISECONDS',
			value: highestEventDelaySoFar,
		};

		//
	}
	catch (error) {
		//console.log(error);
		return {
			_id: 'HIGHEST_VEHICLE_EVENT_DELAY',
			grade: 'fail',
			message: error.message,
			reason: null,
			status: AnalysisResultStatus.ERROR,
			unit: null,
			value: null,
		};
	}

	//
};
