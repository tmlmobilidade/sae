/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { RideAnalysis } from '@tmlmobilidade/services/types';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'SIMPLE_ONE_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION'
	reason: 'FOUND_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION' | 'NO_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION_FOUND'
};

/**
 * This analyzer tests if at least one vehicle event or one validation is found for the trip.
 *
 * GRADES:
 * → PASS = At least one Vehicle Event OR one Validation Transaction is found for the trip.
 * → FAIL = No Vehicle Events OR Validation Transactions found for the trip.
 */
export function simpleOneVehicleEventOrValidationTransactionAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
	try {
		//

		// 1.
		// Test if at least one Vehicle Event is found

		if (analysisData.vehicle_events.length > 0 || analysisData.validation_transactions.length > 0) {
			return {
				_id: 'SIMPLE_ONE_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION',
				grade: 'pass',
				message: `Found ${analysisData.vehicle_events.length} Vehicle Events and ${analysisData.validation_transactions.length} Validation Transactions for this trip.`,
				reason: 'FOUND_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION',
				unit: null,
				value: null,
			};
		}

		return {
			_id: 'SIMPLE_ONE_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION',
			grade: 'fail',
			message: 'No Vehicle Events or Validation Transactions found for this trip.',
			reason: 'NO_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION_FOUND',
			unit: null,
			value: null,
		};

		//
	}
	catch (error) {
		return {
			_id: 'SIMPLE_ONE_VEHICLE_EVENT_OR_VALIDATION_TRANSACTION',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
