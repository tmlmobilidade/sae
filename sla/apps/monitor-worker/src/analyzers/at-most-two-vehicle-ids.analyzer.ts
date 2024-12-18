/* * */

import { AnalysisData } from '@/types/analysis-data.type.js';
import { RideAnalysis } from '@tmlmobilidade/services/types';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'AT_MOST_TWO_VEHICLE_IDS'
	reason: 'FOUND_MORE_THAN_2_VEHICLE_IDS' | 'FOUND_ONE_OR_TWO_VEHICLE_IDS' | 'NO_VEHICLE_ID_FOUND'
	unit: 'UNIQUE_VEHICLE_IDS'
};

/**
 * This analyzer tests if the trip has at most two vehicle IDs (at least one, maximum of two).
 *
 * GRADES:
 * → PASS = At least one Vehicle, and maximum two Vehicle IDs for the trip.
 * → FAIL = No Vehicle or more than two Vehicle IDs for the trip.
 */
export function atMostTwoVehicleIdsAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
	try {
		//

		if (analysisData.ride.vehicle_ids.length === 0) {
			return {
				_id: 'AT_MOST_TWO_VEHICLE_IDS',
				grade: 'fail',
				message: 'No Vehicle IDs found for this trip.',
				reason: 'NO_VEHICLE_ID_FOUND',
				unit: 'UNIQUE_VEHICLE_IDS',
				value: 0,
			};
		}

		if (analysisData.ride.vehicle_ids.length > 2) {
			return {
				_id: 'AT_MOST_TWO_VEHICLE_IDS',
				grade: 'fail',
				message: `Found ${analysisData.ride.vehicle_ids.length} Vehicle IDs for this trip.`,
				reason: 'FOUND_MORE_THAN_2_VEHICLE_IDS',
				unit: 'UNIQUE_VEHICLE_IDS',
				value: analysisData.ride.vehicle_ids.length,
			};
		}

		return {
			_id: 'AT_MOST_TWO_VEHICLE_IDS',
			grade: 'pass',
			message: `Found ${analysisData.ride.vehicle_ids.length} Vehicle IDs for this trip.`,
			reason: 'FOUND_ONE_OR_TWO_VEHICLE_IDS',
			unit: 'UNIQUE_VEHICLE_IDS',
			value: analysisData.ride.vehicle_ids.length,
		};

		//
	}
	catch (error) {
		return {
			_id: 'AT_MOST_TWO_VEHICLE_IDS',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
