/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { RideAnalysis } from '@tmlmobilidade/services/types';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'SIMPLE_ONE_VALIDATION_TRANSACTION'
	reason: 'FOUND_AT_LEAST_ONE_VALIDATION_TRANSACTION' | 'NO_VALIDATION_TRANSACTION_FOUND'
	unit: 'VALIDATION_TRANSACTIONS_QTY'
};

/**
 * This analyzer tests if at least one validation is found for the trip.
 *
 * GRADES:
 * → PASS = At least one Validation Transaction is found for the trip.
 * → FAIL = No Validation Transactions found for the trip.
 */
export function simpleOneValidationTransactionAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
	try {
		//

		// 1.
		// Test if at least one Validation Transaction is found

		if (analysisData.validation_transactions.length > 0) {
			return {
				_id: 'SIMPLE_ONE_VALIDATION_TRANSACTION',
				grade: 'pass',
				message: `Found ${analysisData.validation_transactions.length} Validation Transactions for this trip.`,
				reason: 'FOUND_AT_LEAST_ONE_VALIDATION_TRANSACTION',
				unit: 'VALIDATION_TRANSACTIONS_QTY',
				value: analysisData.validation_transactions.length,
			};
		}

		return {
			_id: 'SIMPLE_ONE_VALIDATION_TRANSACTION',
			grade: 'fail',
			message: 'No Validation Transactions found for this trip.',
			reason: 'NO_VALIDATION_TRANSACTION_FOUND',
			unit: 'VALIDATION_TRANSACTIONS_QTY',
			value: 0,
		};

		//
	}
	catch (error) {
		return {
			_id: 'SIMPLE_ONE_VALIDATION_TRANSACTION',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
