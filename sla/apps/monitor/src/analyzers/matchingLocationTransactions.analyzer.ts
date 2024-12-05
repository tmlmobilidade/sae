/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { RideAnalysis } from '@tmlmobilidade/services/types';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'MATCHING_LOCATION_TRANSACTIONS'
	reason: 'ALL_STOPS_HAVE_LOCATION_TRANSACTIONS' | 'MISSING_LOCATION_TRANSACTION_FOR_AT_LEAST_ONE_STOP'
};

/**
 * This analyzer tests if there are Location Transactions for all stops of the trip.
 *
 * GRADES:
 * → PASS = At least one Location Transaction for each stop of the trip.
 * → FAIL = Missing Location Transaction for any stop of the trip.
 */
export function matchingLocationTransactionsAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
	try {
		//

		// 1.
		// Initiate Sets

		const pathStopIds = new Set();
		const locationTransactionsStopIds = new Set();

		// 2.
		// Save references to all stops for each source type

		for (const pathStop of analysisData.hashed_trip.path) {
			pathStopIds.add(pathStop.stop_id);
		}

		for (const locationTransaction of analysisData.location_transactions) {
			locationTransactionsStopIds.add(locationTransaction.stop_id);
		}

		// 3.
		// Check if all locationTransactionsStopIds are available in pathStopIds

		const missingStopIds = new Set();

		for (const pathStopId of pathStopIds.values()) {
			if (!locationTransactionsStopIds.has(pathStopId)) {
				missingStopIds.add(pathStopId);
			}
		}

		// 4.
		// Assign grades to analysis

		if (missingStopIds.size > 0) {
			return {
				_id: 'MATCHING_LOCATION_TRANSACTIONS',
				grade: 'fail',
				message: `At least one Stop ID was not found in Location Transactions. Missing Stop IDs: [${Array.from(missingStopIds).join('|')}]`,
				reason: 'MISSING_LOCATION_TRANSACTION_FOR_AT_LEAST_ONE_STOP',
				unit: null,
				value: null,
			};
		}

		return {
			_id: 'MATCHING_LOCATION_TRANSACTIONS',
			grade: 'pass',
			message: `Found ${locationTransactionsStopIds.size} Location Transactions for ${pathStopIds.size} Stop IDs.`,
			reason: 'ALL_STOPS_HAVE_LOCATION_TRANSACTIONS',
			unit: null,
			value: null,
		};

		//
	}
	catch (error) {
		return {
			_id: 'MATCHING_LOCATION_TRANSACTIONS',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
