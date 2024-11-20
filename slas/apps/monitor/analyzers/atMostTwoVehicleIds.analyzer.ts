/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { AnalysisResult, AnalysisResultGrade, AnalysisResultStatus } from '@/types/analysisResult.type.js';

/* * */

// This analyzer tests if the trip has at most two vehicle IDs (at least one, maximum of two).
//
// GRADES:
// → PASS = At least one Vehicle, and maximum two Vehicle IDs for the trip.
// → FAIL = No Vehicle or more than two Vehicle IDs for the trip.

/* * */

interface ExtendedAnalysisResult extends AnalysisResult {
	code: 'AT_MOST_TWO_VEHICLE_IDS'
	reason: 'FOUND_MORE_THAN_2_VEHICLE_IDS' | 'FOUND_ONE_OR_TWO_VEHICLE_IDS' | 'NO_VEHICLE_ID_FOUND'
	unit: 'UNIQUE_VEHICLE_IDS' | null
	value: null | number
};

/* * */

export default (analysisData: AnalysisData): ExtendedAnalysisResult => {
	//

	try {
		//

		// 1.
		// Initiate a Set

		const foundVehicleIds = new Set();

		// 2.
		// Test for how many driver IDs are found

		for (const event of analysisData.vehicle_events) {
			foundVehicleIds.add(event.content.entity[0].vehicle.vehicle._id);
		}

		if (foundVehicleIds.size === 0) {
			return {
				code: 'AT_MOST_TWO_VEHICLE_IDS',
				grade: AnalysisResultGrade.FAIL,
				message: 'No Vehicle IDs found for this trip.',
				reason: 'NO_VEHICLE_ID_FOUND',
				status: AnalysisResultStatus.COMPLETE,
				unit: 'UNIQUE_VEHICLE_IDS',
				value: 0,
			};
		}

		if (foundVehicleIds.size > 2) {
			return {
				code: 'AT_MOST_TWO_VEHICLE_IDS',
				grade: AnalysisResultGrade.FAIL,
				message: `Found ${foundVehicleIds.size} Vehicle IDs for this trip.`,
				reason: 'FOUND_MORE_THAN_2_VEHICLE_IDS',
				status: AnalysisResultStatus.COMPLETE,
				unit: 'UNIQUE_VEHICLE_IDS',
				value: foundVehicleIds.size,
			};
		}

		return {
			code: 'AT_MOST_TWO_VEHICLE_IDS',
			grade: AnalysisResultGrade.PASS,
			message: `Found ${foundVehicleIds.size} Vehicle IDs for this trip.`,
			reason: 'FOUND_ONE_OR_TWO_VEHICLE_IDS',
			status: AnalysisResultStatus.COMPLETE,
			unit: 'UNIQUE_VEHICLE_IDS',
			value: foundVehicleIds.size,
		};

		//
	}
	catch (error) {
		console.log(error);
		return {
			code: 'AT_MOST_TWO_VEHICLE_IDS',
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
