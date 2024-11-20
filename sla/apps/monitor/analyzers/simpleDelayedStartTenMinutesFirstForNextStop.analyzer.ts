/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { AnalysisResult, AnalysisResultGrade, AnalysisResultStatus } from '@/types/analysisResult.type.js';
import { DateTime } from 'luxon';

/* * */

// This analyzer tests if there is an excess delay starting the trip using event data.
// It uses the timestamp of the first event that does not match the Stop ID
// of the first stop of the trip to determine the trip start time.
//
// GRADES:
// → PASS = Trip start time delay is less than or equal to 10 minutes.
// → FAIL = Trip start time delay is greater than 10 minutes.

/* * */

interface ExtendedAnalysisResult extends AnalysisResult {
	code: 'SIMPLE_DELAYED_START_TEN_MINUTES_FIRST_FOR_NEXT_STOP'
	reason: 'NO_EVENT_FOUND_FOR_NEXT_STOP_ID' | 'TRIP_STARTED_LESS_THAN_OR_EQUAL_TO_TEN_MINUTES_LATE' | 'TRIP_STARTED_MORE_THAN_TEN_MINUTES_LATE'
	unit: 'MINUTES_FROM_SCHEDULED_START_TIME' | null
	value: null | number
};

/* * */

export default (analysisData: AnalysisData): ExtendedAnalysisResult => {
	//

	try {
		//

		// 1.
		// Sort the path by stop_sequence

		const sortedTripPath = analysisData.hashed_trip.path.sort((a, b) => {
			return a.stop_sequence - b.stop_sequence;
		});

		// 2.
		// Prepare the operational day date for the given trip

		let operationalDayDateTimeObject = DateTime.fromFormat(analysisData.trip_analysis.operational_day, 'yyyyMMdd', { zone: 'Europe/Lisbon' }).startOf('day');

		// 3.
		// Extract the ID and the expected arrival time of the first stop of the trip

		const firstStopId = sortedTripPath[0]?.stop_id;

		const firstStopExpectedArrivalTime = sortedTripPath[0]?.arrival_time;

		const expectedArrivalTimeHours = firstStopExpectedArrivalTime.split(':')[0];
		const expectedArrivalTimeMinutes = firstStopExpectedArrivalTime.split(':')[1];
		const expectedArrivalTimeSeconds = firstStopExpectedArrivalTime.split(':')[2];

		if (expectedArrivalTimeHours > 23 && expectedArrivalTimeMinutes > 59 && expectedArrivalTimeSeconds > 59) {
			operationalDayDateTimeObject = operationalDayDateTimeObject.plus({ days: 1 });
		}

		const expectedArrivalTimeDateTimeObject = operationalDayDateTimeObject.set({ hour: expectedArrivalTimeHours, minute: expectedArrivalTimeMinutes, second: expectedArrivalTimeSeconds });

		// 4.
		// Sort vehicle events by vehicle timestamp

		const sortedVehicleEvents = analysisData.vehicle_events?.sort((a, b) => {
			return a.content.entity[0].vehicle.timestamp - b.content.entity[0].vehicle.timestamp;
		});

		// 5.
		// For each point, check if they are inside the geofence or not
		// Record the last event that is inside the geofence

		let firstEventForFirstStopIdFound = false;

		let firstEventForNextStopId = null;

		for (const vehicleEventData of sortedVehicleEvents) {
			//
			const vehicleEventStopId = vehicleEventData.content.entity[0].vehicle.stopId;
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
				code: 'SIMPLE_DELAYED_START_TEN_MINUTES_FIRST_FOR_NEXT_STOP',
				grade: AnalysisResultGrade.FAIL,
				message: 'No event found for the next stop ID after the first stop ID.',
				reason: 'NO_EVENT_FOUND_FOR_NEXT_STOP_ID',
				status: AnalysisResultStatus.COMPLETE,
				unit: null,
				value: null,
			};
		}

		// 6.
		// Check the timestamp of the event against the expected arrival time of the first stop

		const firstEventForNextStopIdTimestamp = firstEventForNextStopId?.content.entity[0].vehicle.timestamp;
		const firstEventForNextStopIdDateTimeObject = DateTime.fromSeconds(firstEventForNextStopIdTimestamp, { zone: 'Europe/Lisbon' });

		const delayInMinutes = firstEventForNextStopIdDateTimeObject.diff(expectedArrivalTimeDateTimeObject, 'minutes').minutes;

		// 6.
		// Return the result

		if (delayInMinutes <= 10) {
			return {
				code: 'SIMPLE_DELAYED_START_TEN_MINUTES_FIRST_FOR_NEXT_STOP',
				grade: AnalysisResultGrade.PASS,
				message: `Trip start time delay is ${delayInMinutes} minutes.`,
				reason: 'TRIP_STARTED_LESS_THAN_OR_EQUAL_TO_TEN_MINUTES_LATE',
				status: AnalysisResultStatus.COMPLETE,
				unit: 'MINUTES_FROM_SCHEDULED_START_TIME',
				value: delayInMinutes,
			};
		}

		return {
			code: 'SIMPLE_DELAYED_START_TEN_MINUTES_FIRST_FOR_NEXT_STOP',
			grade: AnalysisResultGrade.FAIL,
			message: `Trip start time delay is ${delayInMinutes} minutes.`,
			reason: 'TRIP_STARTED_MORE_THAN_TEN_MINUTES_LATE',
			status: AnalysisResultStatus.COMPLETE,
			unit: 'MINUTES_FROM_SCHEDULED_START_TIME',
			value: delayInMinutes,
		};

		//
	}
	catch (error) {
		console.log(error);
		return {
			code: 'SIMPLE_DELAYED_START_TEN_MINUTES_FIRST_FOR_NEXT_STOP',
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
