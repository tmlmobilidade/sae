/* * */

import { AnalysisData } from '@/types/analysis-data.type.js';
import { RideAnalysis } from '@tmlmobilidade/services/types';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'AT_MOST_TWO_DRIVER_IDS'
	reason: 'FOUND_MORE_THAN_2_DRIVER_IDS' | 'FOUND_ONE_OR_TWO_DRIVER_IDS' | 'NO_DRIVER_ID_FOUND'
	unit: 'UNIQUE_DRIVER_IDS'
};

/**
 * This analyzer tests if the trip has at most two drivers (at least one, maximum of two).
 *
 * GRADES:
 * → PASS = At least one Driver, and maximum two Driver IDs for the trip.
 * → FAIL = No Driver or more than two Drivers IDs for the trip.
 */
export function atMostTwoDriverIdsAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
	try {
		//

		// 1.
		// Initiate a Set

		const foundDriverIds = new Set();

		// 2.
		// Test for how many driver IDs are found

		for (const event of analysisData.vehicle_events) {
			foundDriverIds.add(event.driver_id);
		}

		if (foundDriverIds.size === 0) {
			return {
				_id: 'AT_MOST_TWO_DRIVER_IDS',
				grade: 'fail',
				message: 'No Driver IDs found for this trip.',
				reason: 'NO_DRIVER_ID_FOUND',
				unit: 'UNIQUE_DRIVER_IDS',
				value: 0,
			};
		}

		if (foundDriverIds.size > 2) {
			return {
				_id: 'AT_MOST_TWO_DRIVER_IDS',
				grade: 'fail',
				message: `Found ${foundDriverIds.size} Driver IDs for this trip.`,
				reason: 'FOUND_MORE_THAN_2_DRIVER_IDS',
				unit: 'UNIQUE_DRIVER_IDS',
				value: foundDriverIds.size,
			};
		}

		return {
			_id: 'AT_MOST_TWO_DRIVER_IDS',
			grade: 'pass',
			message: `Found ${foundDriverIds.size} Driver IDs for this trip.`,
			reason: 'FOUND_ONE_OR_TWO_DRIVER_IDS',
			unit: 'UNIQUE_DRIVER_IDS',
			value: foundDriverIds.size,
		};

		//
	}
	catch (error) {
		return {
			_id: 'AT_MOST_TWO_DRIVER_IDS',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
