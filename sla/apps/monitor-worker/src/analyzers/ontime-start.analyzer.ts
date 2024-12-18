/* * */

import { AnalysisData } from '@/types/analysis-data.type.js';
import { RideAnalysis } from '@tmlmobilidade/services/types';
import { DateTime } from 'luxon';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'ONTIME_START'
	reason: 'NO_OBSERVED_START_TIME' | 'NO_SCHEDULED_START_TIME' | 'RIDE_STARTED_EARLY' | 'RIDE_STARTED_MORE_THAN_FIVE_MINUTES_LATE' | 'RIDE_STARTED_ZERO_TO_FIVE_MINUTES_LATE'
	unit: 'DIFF_IN_MINUTES_FROM_SCHEDULED_START_TIME'
};

/**
 * This analyzer tests if there is an excess delay starting the trip using geographic data.
 * It uses the timestamp of the first event that is outside the geofence
 * of the first stop of the trip to determine the trip start time.
 *
 * GRADES:
 * → PASS = Ride start time delay is less than or equal to five minutes.
 * → FAIL = Ride start time delay is greater than five minutes.
 */
export function ontimeStartAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
	try {
		//

		//
		// Validate that the test has the necessary data

		if (!analysisData.ride.start_time_scheduled) {
			return {
				_id: 'ONTIME_START',
				grade: 'fail',
				message: 'Ride has no scheduled start_time.',
				reason: 'NO_SCHEDULED_START_TIME',
				unit: null,
				value: null,
			};
		}

		if (!analysisData.ride.start_time_observed) {
			return {
				_id: 'ONTIME_START',
				grade: 'fail',
				message: 'Ride has no observed start_time.',
				reason: 'NO_OBSERVED_START_TIME',
				unit: null,
				value: null,
			};
		}

		//
		// Calculate the delay in minutes

		const delayInMinutes = DateTime
			.fromJSDate(analysisData.ride.start_time_observed)
			.diff(DateTime.fromJSDate(analysisData.ride.start_time_scheduled))
			.as('minutes');

		//
		// Classify the delay

		if (delayInMinutes < 0) {
			return {
				_id: 'ONTIME_START',
				grade: 'fail',
				message: `Ride started ${delayInMinutes} minutes early.`,
				reason: 'RIDE_STARTED_EARLY',
				unit: 'DIFF_IN_MINUTES_FROM_SCHEDULED_START_TIME',
				value: delayInMinutes,
			};
		}

		if (delayInMinutes >= 0 && delayInMinutes <= 5) {
			return {
				_id: 'ONTIME_START',
				grade: 'pass',
				message: `Ride started ${delayInMinutes} minutes late.`,
				reason: 'RIDE_STARTED_ZERO_TO_FIVE_MINUTES_LATE',
				unit: 'DIFF_IN_MINUTES_FROM_SCHEDULED_START_TIME',
				value: delayInMinutes,
			};
		}

		if (delayInMinutes > 5) {
			return {
				_id: 'ONTIME_START',
				grade: 'fail',
				message: `Ride started ${delayInMinutes} minutes late.`,
				reason: 'RIDE_STARTED_MORE_THAN_FIVE_MINUTES_LATE',
				unit: 'DIFF_IN_MINUTES_FROM_SCHEDULED_START_TIME',
				value: delayInMinutes,
			};
		}

		//
	}
	catch (error) {
		return {
			_id: 'ONTIME_START',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
