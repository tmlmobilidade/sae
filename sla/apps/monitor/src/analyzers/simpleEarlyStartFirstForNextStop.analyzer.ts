/* * */

import { AnalysisData } from '@/types/analysis-data.type.js';
import { sortByDate } from '@/utils/sort-by-date.util.js';
import { RideAnalysis } from '@tmlmobilidade/services/types';
import { DateTime } from 'luxon';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'SIMPLE_EARLY_START_FIRST_FOR_NEXT_STOP'
	reason: 'NO_EVENT_FOUND_FOR_NEXT_STOP_ID' | 'TRIP_STARTED_AT_OR_LATER_THAN_SCHEDULED' | 'TRIP_STARTED_EARLIER_THAN_SCHEDULED'
	unit: 'MINUTES_FROM_SCHEDULED_START_TIME'
};

/**
 * This analyzer tests if the trip started earlier than scheduled using event data.
 * It uses the timestamp of the first event that does not match the Stop ID
 * of the first stop of the trip to determine the trip start time.
 *
 * GRADES:
 * → PASS = Trip started started at scheduled time or later.
 * → FAIL = Trip started earlier than scheduled.
 */
export function simpleEarlyStartFirstForNextStopAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
	try {
		//

		// 1.
		// Sort the path by stop_sequence

		const sortedTripPath = analysisData.hashed_trip.path.sort((a, b) => {
			return a.stop_sequence - b.stop_sequence;
		});

		// 2.
		// Prepare the operational day date for the given trip

		let operationalDayDateTimeObject = DateTime.fromFormat(analysisData.ride.operational_date, 'yyyyMMdd', { zone: 'Europe/Lisbon' }).startOf('day');

		// 3.
		// Extract the ID and the expected arrival time of the first stop of the trip

		const firstStopId = sortedTripPath[0]?.stop_id;

		const firstStopExpectedArrivalTime = sortedTripPath[0]?.arrival_time;

		const expectedArrivalTimeHours = Number(firstStopExpectedArrivalTime.split(':')[0]);
		const expectedArrivalTimeMinutes = Number(firstStopExpectedArrivalTime.split(':')[1]);
		const expectedArrivalTimeSeconds = Number(firstStopExpectedArrivalTime.split(':')[2]);

		if (expectedArrivalTimeHours > 23 && expectedArrivalTimeMinutes > 59 && expectedArrivalTimeSeconds > 59) {
			operationalDayDateTimeObject = operationalDayDateTimeObject.plus({ days: 1 });
		}

		const expectedArrivalTimeDateTimeObject = operationalDayDateTimeObject.set({ hour: expectedArrivalTimeHours, minute: expectedArrivalTimeMinutes, second: expectedArrivalTimeSeconds });

		// 4.
		// Sort vehicle events by vehicle timestamp

		const sortedVehicleEvents = sortByDate(analysisData.vehicle_events, 'created_at');

		// 5.
		// For each point, check if they are inside the geofence or not
		// Record the last event that is inside the geofence

		let firstEventForFirstStopIdFound = false;

		let firstEventForNextStopId = null;

		for (const vehicleEventData of sortedVehicleEvents) {
			//
			const vehicleEventStopId = vehicleEventData.stop_id;
			//
			if (vehicleEventStopId === firstStopId) {
				firstEventForFirstStopIdFound = true;
			}
			//
			if (firstEventForFirstStopIdFound && vehicleEventStopId !== firstStopId) {
				firstEventForNextStopId = vehicleEventData;
				break;
			}
		}

		if (!firstEventForNextStopId) {
			return {
				_id: 'SIMPLE_EARLY_START_FIRST_FOR_NEXT_STOP',
				grade: 'fail',
				message: 'No event found for the next stop ID after the first stop ID.',
				reason: 'NO_EVENT_FOUND_FOR_NEXT_STOP_ID',
				unit: null,
				value: null,
			};
		}

		// 6.
		// Check the timestamp of the event against the expected arrival time of the first stop

		const firstEventForNextStopIdTimestamp = firstEventForNextStopId?.created_at;
		const firstEventForNextStopIdDateTimeObject = DateTime.fromJSDate(firstEventForNextStopIdTimestamp, { zone: 'Europe/Lisbon' });

		const delayInMinutes = firstEventForNextStopIdDateTimeObject.diff(expectedArrivalTimeDateTimeObject, 'minutes').minutes;

		// 6.
		// Return the result

		if (delayInMinutes < 0) {
			return {
				_id: 'SIMPLE_EARLY_START_FIRST_FOR_NEXT_STOP',
				grade: 'fail',
				message: `Trip started ${delayInMinutes} minutes earlier than scheduled.`,
				reason: 'TRIP_STARTED_EARLIER_THAN_SCHEDULED',
				unit: 'MINUTES_FROM_SCHEDULED_START_TIME',
				value: delayInMinutes,
			};
		}

		return {
			_id: 'SIMPLE_EARLY_START_FIRST_FOR_NEXT_STOP',
			grade: 'pass',
			message: `Trip started ${delayInMinutes} minutes after scheduled time.`,
			reason: 'TRIP_STARTED_AT_OR_LATER_THAN_SCHEDULED',
			unit: 'MINUTES_FROM_SCHEDULED_START_TIME',
			value: delayInMinutes,
		};

		//
	}
	catch (error) {
		return {
			_id: 'SIMPLE_EARLY_START_FIRST_FOR_NEXT_STOP',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
