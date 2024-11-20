/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { AnalysisResult, AnalysisResultGrade, AnalysisResultStatus } from '@/types/analysisResult.type.js';

/* * */

// This analyzer tests if at least one vehicle event or one validation is found for the trip.
//
// GRADES:
// → PASS = At least one Vehicle Event OR one Validation Transaction is found for the trip.
// → FAIL = No Vehicle Events OR Validation Transactions found for the trip.

/* * */

interface ExtendedAnalysisResult extends AnalysisResult {
	code: 'SIMPLE_ONE_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION'
	reason: 'FOUND_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION' | 'NO_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION_FOUND'
	unit: null
	value: null
};

/* * */

export default (analysisData: AnalysisData): ExtendedAnalysisResult => {
	//

	try {
		//

		// 1.
		// Test if at least one Vehicle Event is found

		if (analysisData.vehicle_events.length > 0 || analysisData.validation_transactions.length > 0) {
			return {
				code: 'SIMPLE_ONE_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION',
				grade: AnalysisResultGrade.PASS,
				message: `Found ${analysisData.vehicle_events.length} Vehicle Events and ${analysisData.validation_transactions.length} Validation Transactions for this trip.`,
				reason: 'FOUND_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION',
				status: AnalysisResultStatus.COMPLETE,
				unit: null,
				value: null,
			};
		}

		return {
			code: 'SIMPLE_ONE_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION',
			grade: AnalysisResultGrade.FAIL,
			message: 'No Vehicle Events or Validation Transactions found for this trip.',
			reason: 'NO_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION_FOUND',
			status: AnalysisResultStatus.COMPLETE,
			unit: null,
			value: null,
		};

		//
	}
	catch (error) {
		console.log(error);
		return {
			code: 'SIMPLE_ONE_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION',
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
