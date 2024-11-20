/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { AnalysisResult, AnalysisResultGrade, AnalysisResultStatus } from '@/types/analysisResult.type.js';
import * as turf from '@turf/turf';
import { DateTime } from 'luxon';

/* * */

// This analyzer tests if there is an excess delay starting the trip using geographic data.
// It uses the timestamp of the last event that is inside the geofence
// of the first stop of the trip to determine the trip start time.
//
// GRADES:
// → PASS = Trip start time delay is less than or equal to three minutes.
// → FAIL = Trip start time delay is greater than three minutes.

/* * */

interface ExtendedAnalysisResult extends AnalysisResult {
	code: 'GEO_DELAYED_START_THREE_MINUTES_LAST_IN'
	reason: 'NO_EVENT_INSIDE_GEOFENCE_FOUND' | 'TRIP_STARTED_LESS_THAN_OR_EQUAL_TO_THREE_MINUTES_LATE' | 'TRIP_STARTED_MORE_THAN_THREE_MINUTES_LATE'
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
		// Extract the expected arrival time of the first stop of the trip

		const firstStopExpectedArrivalTime = sortedTripPath[0]?.arrival_time;

		const expectedArrivalTimeHours = firstStopExpectedArrivalTime.split(':')[0];
		const expectedArrivalTimeMinutes = firstStopExpectedArrivalTime.split(':')[1];
		const expectedArrivalTimeSeconds = firstStopExpectedArrivalTime.split(':')[2];

		if (expectedArrivalTimeHours > 23 && expectedArrivalTimeMinutes > 59 && expectedArrivalTimeSeconds > 59) {
			operationalDayDateTimeObject = operationalDayDateTimeObject.plus({ days: 1 });
		}

		const expectedArrivalTimeDateTimeObject = operationalDayDateTimeObject.set({ hour: expectedArrivalTimeHours, minute: expectedArrivalTimeMinutes, second: expectedArrivalTimeSeconds });

		// 3.
		// Build a geofence of 30 meters around the first stop of the trip

		const firstStopTurfPoint = turf.point([Number(sortedTripPath[0].stop_lon), Number(sortedTripPath[0].stop_lat)]);
		const firstStopTurfBuffer = turf.buffer(firstStopTurfPoint, 30, { units: 'meters' });

		// 4.
		// Sort vehicle events by vehicle timestamp

		const sortedVehicleEvents = analysisData.vehicle_events?.sort((a, b) => {
			return a.content.entity[0].vehicle.timestamp - b.content.entity[0].vehicle.timestamp;
		});

		// 5.
		// For each point, check if they are inside the geofence or not
		// Record the last event that is inside the geofence

		let atLeastOneEventWasFoundInsideGeofense = false;

		let lastEventInsideGeofence = null;

		for (const vehicleEventData of sortedVehicleEvents) {
			//
			const vehicleEventTurfPoint = turf.point([vehicleEventData.content.entity[0].vehicle.position.longitude, vehicleEventData.content.entity[0].vehicle.position.latitude]);
			//
			const vehicleEventIsInsideGefense = turf.booleanPointInPolygon(vehicleEventTurfPoint, firstStopTurfBuffer);
			//
			if (vehicleEventIsInsideGefense) {
				atLeastOneEventWasFoundInsideGeofense = true;
			}
			//
			if (atLeastOneEventWasFoundInsideGeofense && !vehicleEventIsInsideGefense) {
				lastEventInsideGeofence = vehicleEventData;
				break;
			}
		}

		if (!lastEventInsideGeofence) {
			return {
				code: 'GEO_DELAYED_START_THREE_MINUTES_LAST_IN',
				grade: AnalysisResultGrade.FAIL,
				message: 'No event was found inside the geofence of the first stop.',
				reason: 'NO_EVENT_INSIDE_GEOFENCE_FOUND',
				status: AnalysisResultStatus.COMPLETE,
				unit: null,
				value: null,
			};
		}

		// 6.
		// Check the timestamp of the event against the expected arrival time of the first stop

		const lastEventInsideGeofenceTimestamp = lastEventInsideGeofence?.content.entity[0].vehicle.timestamp;
		const lastEventInsideGeofenceDateTimeObject = DateTime.fromSeconds(lastEventInsideGeofenceTimestamp, { zone: 'Europe/Lisbon' });

		const delayInMinutes = lastEventInsideGeofenceDateTimeObject.diff(expectedArrivalTimeDateTimeObject, 'minutes').minutes;

		// 7.
		// Return the result

		if (delayInMinutes <= 3) {
			return {
				code: 'GEO_DELAYED_START_THREE_MINUTES_LAST_IN',
				grade: AnalysisResultGrade.PASS,
				message: `Trip start time delay is ${delayInMinutes} minutes.`,
				reason: 'TRIP_STARTED_LESS_THAN_OR_EQUAL_TO_THREE_MINUTES_LATE',
				status: AnalysisResultStatus.COMPLETE,
				unit: 'MINUTES_FROM_SCHEDULED_START_TIME',
				value: delayInMinutes,
			};
		}

		return {
			code: 'GEO_DELAYED_START_THREE_MINUTES_LAST_IN',
			grade: AnalysisResultGrade.FAIL,
			message: `Trip start time delay is ${delayInMinutes} minutes.`,
			reason: 'TRIP_STARTED_MORE_THAN_THREE_MINUTES_LATE',
			status: AnalysisResultStatus.COMPLETE,
			unit: 'MINUTES_FROM_SCHEDULED_START_TIME',
			value: delayInMinutes,
		};

		//
	}
	catch (error) {
		console.log(error);
		return {
			code: 'GEO_DELAYED_START_THREE_MINUTES_LAST_IN',
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
