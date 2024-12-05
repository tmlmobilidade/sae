/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { RideAnalysis } from '@tmlmobilidade/services/types';
import * as turf from '@turf/turf';
import { DateTime } from 'luxon';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'GEO_DELAYED_START_FIVE_MINUTES_FIRST_OUT'
	reason: 'NO_EVENT_OUTSIDE_GEOFENCE_FOUND' | 'TRIP_STARTED_LESS_THAN_OR_EQUAL_TO_FIVE_MINUTES_LATE' | 'TRIP_STARTED_MORE_THAN_FIVE_MINUTES_LATE'
	unit: 'MINUTES_FROM_SCHEDULED_START_TIME'
};

/**
 * This analyzer tests if there is an excess delay starting the trip using geographic data.
 * It uses the timestamp of the first event that is outside the geofence
 * of the first stop of the trip to determine the trip start time.
 *
 * GRADES:
 * → PASS = Trip start time delay is less than or equal to five minutes.
 * → FAIL = Trip start time delay is greater than five minutes.
 */
export function geoDelayedStartFiveMinutesFirstOutAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
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
		// Extract the expected arrival time of the first stop of the trip

		const firstStopExpectedArrivalTime = sortedTripPath[0]?.arrival_time;

		const expectedArrivalTimeHours = Number(firstStopExpectedArrivalTime.split(':')[0]);
		const expectedArrivalTimeMinutes = Number(firstStopExpectedArrivalTime.split(':')[1]);
		const expectedArrivalTimeSeconds = Number(firstStopExpectedArrivalTime.split(':')[2]);

		if (expectedArrivalTimeHours > 23 && expectedArrivalTimeMinutes > 59 && expectedArrivalTimeSeconds > 59) {
			operationalDayDateTimeObject = operationalDayDateTimeObject.plus({ days: 1 });
		}

		const expectedArrivalTimeDateTimeObject = operationalDayDateTimeObject.set({
			hour: expectedArrivalTimeHours,
			minute: expectedArrivalTimeMinutes,
			second: expectedArrivalTimeSeconds,
		});

		// 3.
		// Build a geofence of 30 meters around the first stop of the trip

		const firstStopTurfPoint = turf.point([Number(sortedTripPath[0].stop_lon), Number(sortedTripPath[0].stop_lat)]);
		const firstStopTurfBuffer = turf.buffer(firstStopTurfPoint, 30, { units: 'meters' });

		// 4.
		// Sort vehicle events by vehicle timestamp

		const sortedVehicleEvents = analysisData.vehicle_events?.sort((a, b) => {
			return DateTime.fromJSDate(a.vehicle_timestamp).toMillis() - DateTime.fromJSDate(b.vehicle_timestamp).toMillis();
		});

		// 5.
		// For each point, check if they are inside the geofence or not
		// Record the last event that is inside the geofence

		let atLeastOneEventWasFoundInsideGeofense = false;

		let lastEventInsideGeofenceIndex = -1;

		for (const [vehicleEventIndex, vehicleEventData] of sortedVehicleEvents.entries()) {
			//
			const parsedVehicleEventRawData = JSON.parse(vehicleEventData._raw);
			//
			const vehicleEventTurfPoint = turf.point([parsedVehicleEventRawData.content.entity[0].vehicle.position.longitude, parsedVehicleEventRawData.content.entity[0].vehicle.position.latitude]);
			//
			const vehicleEventIsInsideGefense = turf.booleanPointInPolygon(vehicleEventTurfPoint, firstStopTurfBuffer);
			//
			if (vehicleEventIsInsideGefense) {
				atLeastOneEventWasFoundInsideGeofense = true;
			}
			//
			if (atLeastOneEventWasFoundInsideGeofense && !vehicleEventIsInsideGefense) {
				lastEventInsideGeofenceIndex = vehicleEventIndex;
				break;
			}
		}

		const firstEventOutsideGeofence = sortedVehicleEvents[lastEventInsideGeofenceIndex + 1];

		if (!firstEventOutsideGeofence) {
			return {
				_id: 'GEO_DELAYED_START_FIVE_MINUTES_FIRST_OUT',
				grade: 'fail',
				message: 'No first event outside geofence found.',
				reason: 'NO_EVENT_OUTSIDE_GEOFENCE_FOUND',
				unit: null,
				value: null,
			};
		}

		// 6.
		// Check the timestamp of the event against the expected arrival time of the first stop

		const firstEventOutsideGeofenceTimestamp = firstEventOutsideGeofence?.vehicle_timestamp;
		const firstEventOutsideGeofenceDateTimeObject = DateTime.fromJSDate(firstEventOutsideGeofenceTimestamp, { zone: 'Europe/Lisbon' });

		const delayInMinutes = firstEventOutsideGeofenceDateTimeObject.diff(expectedArrivalTimeDateTimeObject, 'minutes').minutes;

		// 7.
		// Return the result

		if (delayInMinutes <= 5) {
			return {
				_id: 'GEO_DELAYED_START_FIVE_MINUTES_FIRST_OUT',
				grade: 'pass',
				message: `Trip start time delay is ${delayInMinutes} minutes.`,
				reason: 'TRIP_STARTED_LESS_THAN_OR_EQUAL_TO_FIVE_MINUTES_LATE',
				unit: 'MINUTES_FROM_SCHEDULED_START_TIME',
				value: delayInMinutes,
			};
		}

		return {
			_id: 'GEO_DELAYED_START_FIVE_MINUTES_FIRST_OUT',
			grade: 'fail',
			message: `Trip start time delay is ${delayInMinutes} minutes.`,
			reason: 'TRIP_STARTED_MORE_THAN_FIVE_MINUTES_LATE',
			unit: 'MINUTES_FROM_SCHEDULED_START_TIME',
			value: delayInMinutes,
		};

		//
	}
	catch (error) {
		// console.log(error);
		return {
			_id: 'GEO_DELAYED_START_FIVE_MINUTES_FIRST_OUT',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
