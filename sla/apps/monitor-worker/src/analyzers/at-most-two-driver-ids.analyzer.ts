/* * */

import { AnalysisData } from '@/types/analysis-data.type.js';
import { RideAnalysis } from '@tmlmobilidade/core/types';

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

		if (analysisData.ride.driver_ids.length === 0) {
			return {
				_id: 'AT_MOST_TWO_DRIVER_IDS',
				grade: 'fail',
				message: 'No Driver IDs found for this trip.',
				reason: 'NO_DRIVER_ID_FOUND',
				unit: 'UNIQUE_DRIVER_IDS',
				value: 0,
			};
		}

		if (analysisData.ride.driver_ids.length > 2) {
			return {
				_id: 'AT_MOST_TWO_DRIVER_IDS',
				grade: 'fail',
				message: `Found ${analysisData.ride.driver_ids.length} Driver IDs for this trip.`,
				reason: 'FOUND_MORE_THAN_2_DRIVER_IDS',
				unit: 'UNIQUE_DRIVER_IDS',
				value: analysisData.ride.driver_ids.length,
			};
		}

		return {
			_id: 'AT_MOST_TWO_DRIVER_IDS',
			grade: 'pass',
			message: `Found ${analysisData.ride.driver_ids.length} Driver IDs for this trip.`,
			reason: 'FOUND_ONE_OR_TWO_DRIVER_IDS',
			unit: 'UNIQUE_DRIVER_IDS',
			value: analysisData.ride.driver_ids.length,
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
