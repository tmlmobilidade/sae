/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { AnalysisResult, AnalysisResultGrade, AnalysisResultStatus } from '@/types/analysisResult.type.js';

/* * */

// This analyzer tests if the trip has at most two drivers (at least one, maximum of two).
//
// GRADES:
// → PASS = At least one Driver, and maximum two Driver IDs for the trip.
// → FAIL = No Driver or more than two Drivers IDs for the trip.

/* * */

interface ExtendedAnalysisResult extends AnalysisResult {
	code: 'AT_MOST_TWO_DRIVER_IDS'
	reason: 'FOUND_MORE_THAN_2_DRIVER_IDS' | 'FOUND_ONE_OR_TWO_DRIVER_IDS' | 'NO_DRIVER_ID_FOUND'
	unit: 'UNIQUE_DRIVER_IDS' | null
	value: null | number
};

/* * */

export default (analysisData: AnalysisData): ExtendedAnalysisResult => {
	//

	try {
		//

		// 1.
		// Initiate a Set

		const foundDriverIds = new Set();

		// 2.
		// Test for how many driver IDs are found

		for (const event of analysisData.vehicle_events) {
			foundDriverIds.add(event.content.entity[0].vehicle.vehicle.driverId);
		}

		if (foundDriverIds.size === 0) {
			return {
				code: 'AT_MOST_TWO_DRIVER_IDS',
				grade: AnalysisResultGrade.FAIL,
				message: 'No Driver IDs found for this trip.',
				reason: 'NO_DRIVER_ID_FOUND',
				status: AnalysisResultStatus.COMPLETE,
				unit: 'UNIQUE_DRIVER_IDS',
				value: 0,
			};
		}

		if (foundDriverIds.size > 2) {
			return {
				code: 'AT_MOST_TWO_DRIVER_IDS',
				grade: AnalysisResultGrade.FAIL,
				message: `Found ${foundDriverIds.size} Driver IDs for this trip.`,
				reason: 'FOUND_MORE_THAN_2_DRIVER_IDS',
				status: AnalysisResultStatus.COMPLETE,
				unit: 'UNIQUE_DRIVER_IDS',
				value: foundDriverIds.size,
			};
		}

		return {
			code: 'AT_MOST_TWO_DRIVER_IDS',
			grade: AnalysisResultGrade.PASS,
			message: `Found ${foundDriverIds.size} Driver IDs for this trip.`,
			reason: 'FOUND_ONE_OR_TWO_DRIVER_IDS',
			status: AnalysisResultStatus.COMPLETE,
			unit: 'UNIQUE_DRIVER_IDS',
			value: foundDriverIds.size,
		};

		//
	}
	catch (error) {
		console.log(error);
		return {
			code: 'AT_MOST_TWO_DRIVER_IDS',
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
