/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { AnalysisResult, AnalysisResultGrade, AnalysisResultStatus } from '@/types/analysisResult.type.js';

/* * */

// This analyzer tests if at the trip has less than ten Vehicle Events.
//
// GRADES:
// → PASS = More than ten Vehicle Events found for the trip.
// → FAIL = Less than or equal to ten Vehicle Events found for the trip.

/* * */

interface ExtendedAnalysisResult extends AnalysisResult {
	code: 'LESS_THAN_TEN_VEHICLE_EVENTS'
	reason: 'FOUND_MORE_THAN_10_VEHICLE_EVENTS' | 'FOUND_ONLY_1_VEHICLE_EVENT' | `FOUND_ONLY_${number}_VEHICLE_EVENTS`
	unit: 'VEHICLE_EVENTS_QTY' | null
	value: null | number
};

/* * */

export default (analysisData: AnalysisData): ExtendedAnalysisResult => {
	//

	try {
		//

		// 1.
		// Test if the trip has more than ten Vehicle Events

		if (analysisData.vehicle_events.length > 10) {
			return {
				code: 'LESS_THAN_TEN_VEHICLE_EVENTS',
				grade: AnalysisResultGrade.PASS,
				message: `Found ${analysisData.vehicle_events.length} Vehicle Events for this trip.`,
				reason: 'FOUND_MORE_THAN_10_VEHICLE_EVENTS',
				status: AnalysisResultStatus.COMPLETE,
				unit: 'VEHICLE_EVENTS_QTY',
				value: analysisData.vehicle_events.length,
			};
		}

		if (analysisData.vehicle_events.length === 1) {
			return {
				code: 'LESS_THAN_TEN_VEHICLE_EVENTS',
				grade: AnalysisResultGrade.FAIL,
				message: `Found ${analysisData.vehicle_events.length} Vehicle Events for this trip.`,
				reason: 'FOUND_ONLY_1_VEHICLE_EVENT',
				status: AnalysisResultStatus.COMPLETE,
				unit: 'VEHICLE_EVENTS_QTY',
				value: analysisData.vehicle_events.length,
			};
		}

		return {
			code: 'LESS_THAN_TEN_VEHICLE_EVENTS',
			grade: AnalysisResultGrade.FAIL,
			message: `Found ${analysisData.vehicle_events.length} Vehicle Events for this trip.`,
			reason: `FOUND_ONLY_${analysisData.vehicle_events.length}_VEHICLE_EVENTS`,
			status: AnalysisResultStatus.COMPLETE,
			unit: 'VEHICLE_EVENTS_QTY',
			value: analysisData.vehicle_events.length,
		};

		//
	}
	catch (error) {
		console.log(error);
		return {
			code: 'LESS_THAN_TEN_VEHICLE_EVENTS',
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
