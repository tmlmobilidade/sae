/* * */

import { AnalysisData } from '@/types/analysis-data.type.js';
import { sortByDate } from '@/utils/sort-by-date.util.js';
import { RideAnalysis, VehicleEvent } from '@tmlmobilidade/services/types';
import * as turf from '@turf/turf';
import { DateTime } from 'luxon';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'GEO_DELAYED_START_LAST_IN'
	reason: 'NO_EVENT_INSIDE_GEOFENCE_FOUND' | 'TRIP_STARTED_LESS_THAN_OR_EQUAL_TO_FIVE_MINUTES_LATE' | 'TRIP_STARTED_MORE_THAN_FIVE_MINUTES_LATE'
	unit: 'MINUTES_FROM_SCHEDULED_START_TIME' | null
	value: null | number
};

/**
 * This analyzer tests if there is an excess delay starting the trip using geographic data.
 * It uses the timestamp of the last event that is inside the geofence
 * of the first stop of the trip to determine the trip start time.
 *
 * GRADES:
 * → PASS = Trip start time delay is less than or equal to five minutes.
 * → FAIL = Trip start time delay is greater than five minutes.
 */
export function geoDelayedStartLastInAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
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

		const expectedArrivalTimeDateTimeObject = operationalDayDateTimeObject.set({ hour: expectedArrivalTimeHours, minute: expectedArrivalTimeMinutes, second: expectedArrivalTimeSeconds });

		// 3.
		// Build a geofence of 30 meters around the first stop of the trip

		const firstStopTurfPoint = turf.point([Number(sortedTripPath[0].stop_lon), Number(sortedTripPath[0].stop_lat)]);
		const firstStopTurfBuffer = turf.buffer(firstStopTurfPoint, 30, { units: 'meters' });

		// 4.
		// Sort vehicle events by vehicle timestamp

		const sortedVehicleEvents = sortByDate(analysisData.vehicle_events, 'created_at');

		// 5.
		// For each point, check if they are inside the geofence or not
		// Record the last event that is inside the geofence

		let atLeastOneEventWasFoundInsideGeofense = false;

		let lastEventInsideGeofence: null | VehicleEvent = null;

		for (const vehicleEventData of sortedVehicleEvents) {
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
				lastEventInsideGeofence = vehicleEventData;
				break;
			}
		}

		if (!lastEventInsideGeofence) {
			return {
				_id: 'GEO_DELAYED_START_LAST_IN',
				grade: 'fail',
				message: 'No event was found inside the geofence of the first stop.',
				reason: 'NO_EVENT_INSIDE_GEOFENCE_FOUND',
				unit: null,
				value: null,
			};
		}

		// 6.
		// Check the timestamp of the event against the expected arrival time of the first stop

		const lastEventInsideGeofenceTimestamp = lastEventInsideGeofence?.created_at;
		const lastEventInsideGeofenceDateTimeObject = DateTime.fromJSDate(lastEventInsideGeofenceTimestamp, { zone: 'Europe/Lisbon' });

		const delayInMinutes = lastEventInsideGeofenceDateTimeObject.diff(expectedArrivalTimeDateTimeObject, 'minutes').minutes;

		// 7.
		// Return the result

		if (delayInMinutes <= 5) {
			return {
				_id: 'GEO_DELAYED_START_LAST_IN',
				grade: 'pass',
				message: `Trip start time delay is ${delayInMinutes} minutes.`,
				reason: 'TRIP_STARTED_LESS_THAN_OR_EQUAL_TO_FIVE_MINUTES_LATE',
				unit: 'MINUTES_FROM_SCHEDULED_START_TIME',
				value: delayInMinutes,
			};
		}

		return {
			_id: 'GEO_DELAYED_START_LAST_IN',
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
			_id: 'GEO_DELAYED_START_LAST_IN',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
