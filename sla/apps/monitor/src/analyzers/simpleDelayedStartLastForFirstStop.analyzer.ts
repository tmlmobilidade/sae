/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { RideAnalysis } from '@tmlmobilidade/services/types';
import { DateTime } from 'luxon';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'SIMPLE_DELAYED_START_LAST_FOR_FIRST_STOP'
	reason: 'NO_LAST_EVENT_FOR_FIRST_STOP_ID' | 'TRIP_STARTED_LESS_THAN_OR_EQUAL_TO_FIVE_MINUTES_LATE' | 'TRIP_STARTED_MORE_THAN_FIVE_MINUTES_LATE'
	unit: 'MINUTES_FROM_SCHEDULED_START_TIME'
};

/**
 * This analyzer tests if there is an excess delay starting the trip using event data.
 *
 * GRADES:
 * → PASS = Trip start time delay is less than or equal to 5 minutes.
 * → FAIL = Trip start time delay is greater than 5 minutes.
 */
export function simpleDelayedStartLastForFirstStopAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
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

		const sortedVehicleEvents = analysisData.vehicle_events?.sort((a, b) => {
			return DateTime.fromJSDate(a.vehicle_timestamp).toMillis() - DateTime.fromJSDate(b.vehicle_timestamp).toMillis();
		});

		// 5.
		// For each point, check if they are inside the geofence or not
		// Record the last event that is inside the geofence

		let firstEventForFirstStopIdFound = false;

		let firstEventForNextStopIdIndex = -1;

		for (const [vehicleEventIndex, vehicleEventData] of sortedVehicleEvents.entries()) {
			//
			const vehicleEventStopId = vehicleEventData.stop_id;
			//
			if (vehicleEventStopId === firstStopId) {
				firstEventForFirstStopIdFound = true;
			}
			//
			if (firstEventForFirstStopIdFound && vehicleEventStopId !== firstStopId) {
				firstEventForNextStopIdIndex = vehicleEventIndex;
				break;
			}
		}

		const lastEventForFirstStopId = sortedVehicleEvents[firstEventForNextStopIdIndex - 1];

		if (!lastEventForFirstStopId) {
			return {
				_id: 'SIMPLE_DELAYED_START_LAST_FOR_FIRST_STOP',
				grade: 'fail',
				message: 'No last event for first stop ID found.',
				reason: 'NO_LAST_EVENT_FOR_FIRST_STOP_ID',
				unit: null,
				value: null,
			};
		}

		// 6.
		// Check the timestamp of the event against the expected arrival time of the first stop

		const lastEventForFirstStopIdTimestamp = lastEventForFirstStopId?.vehicle_timestamp;
		const lastEventForFirstStopIdDateTimeObject = DateTime.fromJSDate(lastEventForFirstStopIdTimestamp, { zone: 'Europe/Lisbon' });

		const delayInMinutes = lastEventForFirstStopIdDateTimeObject.diff(expectedArrivalTimeDateTimeObject, 'minutes').minutes;

		// 7.
		// Return the result

		if (delayInMinutes <= 5) {
			return {
				_id: 'SIMPLE_DELAYED_START_LAST_FOR_FIRST_STOP',
				grade: 'pass',
				message: `Trip start time delay is ${delayInMinutes} minutes.`,
				reason: 'TRIP_STARTED_LESS_THAN_OR_EQUAL_TO_FIVE_MINUTES_LATE',
				unit: 'MINUTES_FROM_SCHEDULED_START_TIME',
				value: delayInMinutes,
			};
		}

		return {
			_id: 'SIMPLE_DELAYED_START_LAST_FOR_FIRST_STOP',
			grade: 'fail',
			message: `Trip start time delay is ${delayInMinutes} minutes.`,
			reason: 'TRIP_STARTED_MORE_THAN_FIVE_MINUTES_LATE',
			unit: 'MINUTES_FROM_SCHEDULED_START_TIME',
			value: delayInMinutes,
		};

		//
	}
	catch (error) {
		return {
			_id: 'SIMPLE_DELAYED_START_LAST_FOR_FIRST_STOP',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
