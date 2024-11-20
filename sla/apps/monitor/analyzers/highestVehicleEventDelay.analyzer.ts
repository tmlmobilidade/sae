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

interface ExtendedAnalysisResult extends AnalysisResult {
	code: 'HIGHEST_VEHICLE_EVENT_DELAY'
	reason: null
	unit: 'HIGHEST_EVENT_DELAY_IN_MILLISECONDS' | null
	value: null | number
};

/* * */

export default (analysisData: AnalysisData): ExtendedAnalysisResult => {
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
			code: 'HIGHEST_VEHICLE_EVENT_DELAY',
			grade: AnalysisResultGrade.PASS,
			message: null,
			reason: null,
			status: AnalysisResultStatus.COMPLETE,
			unit: 'HIGHEST_EVENT_DELAY_IN_MILLISECONDS',
			value: highestEventDelaySoFar,
		};

		//
	}
	catch (error) {
		console.log(error);
		return {
			code: 'HIGHEST_VEHICLE_EVENT_DELAY',
			grade: AnalysisResultGrade.FAIL,
			message: error.message,
			reason: null,
			status: AnalysisResultStatus.ERROR,
			unit: null,
			value: null,
		};
	}

	//
};
