/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { AnalysisResult, AnalysisResultGrade, AnalysisResultStatus } from '@/types/analysisResult.type.js';

/* * */

// This analyzer tests if there are events with excessive delay between the vehicle and PCGI.
//
// GRADES:
// → PASS = Delay between Vehicle and PCGI timestamps is less than 10 seconds.
// → FAIL = Delay between Vehicle and PCGI timestamps is equal to or higher than 10 seconds.

/* * */

interface ExtendedAnalysisResult extends AnalysisResult {
	code: 'EXCESSIVE_VEHICLE_EVENT_DELAY'
	reason: 'ALL_VEHICLE_EVENTS_ARE_WITHIN_DELAY_LIMITS' | `THERE_ARE_${number}_VEHICLE_EVENTS_WITH_EXCESSIVE_DELAY`
	unit: 'COUNT_OF_VEHICLE_EVENTS_WITH_EXCESSIVE_DELAY' | null
	value: null | number
};

/* * */

export default (analysisData: AnalysisData): ExtendedAnalysisResult => {
	//

	try {
		//

		// 1.
		// Initiate a counting variable

		let countOfEventsWithDelay = 0;

		// 2.
		// Evaluate each vehicle event

		for (const vehicleEvent of analysisData.vehicle_events) {
			//
			const pcgiTimestamp = vehicleEvent.millis;
			const vehicleTimestamp = vehicleEvent.content.entity[0].vehicle.timestamp * 1000;
			//
			const delayInMilliseconds = pcgiTimestamp - vehicleTimestamp;
			//
			if (delayInMilliseconds >= 10000) {
				countOfEventsWithDelay++;
			}
			//
		}

		if (countOfEventsWithDelay === 0) {
			return {
				code: 'EXCESSIVE_VEHICLE_EVENT_DELAY',
				grade: AnalysisResultGrade.PASS,
				message: 'All vehicle events are within delay limits.',
				reason: 'ALL_VEHICLE_EVENTS_ARE_WITHIN_DELAY_LIMITS',
				status: AnalysisResultStatus.COMPLETE,
				unit: 'COUNT_OF_VEHICLE_EVENTS_WITH_EXCESSIVE_DELAY',
				value: 0,
			};
		}

		return {
			code: 'EXCESSIVE_VEHICLE_EVENT_DELAY',
			grade: AnalysisResultGrade.FAIL,
			message: `Found ${countOfEventsWithDelay} vehicle events with excessive delay.`,
			reason: `THERE_ARE_${countOfEventsWithDelay}_VEHICLE_EVENTS_WITH_EXCESSIVE_DELAY`,
			status: AnalysisResultStatus.COMPLETE,
			unit: 'COUNT_OF_VEHICLE_EVENTS_WITH_EXCESSIVE_DELAY',
			value: countOfEventsWithDelay,
		};

		//
	}
	catch (error) {
		console.log(error);
		return {
			code: 'EXCESSIVE_VEHICLE_EVENT_DELAY',
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
