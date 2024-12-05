/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { RideAnalysis } from '@tmlmobilidade/services/types';
import * as turf from '@turf/turf';
import { DateTime } from 'luxon';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'GEO_EARLY_START_LAST_IN'
	reason: 'NO_EVENT_INSIDE_GEOFENCE_FOUND' | 'TRIP_STARTED_AT_OR_LATER_THAN_SCHEDULED' | 'TRIP_STARTED_EARLIER_THAN_SCHEDULED'
	unit: 'MINUTES_FROM_SCHEDULED_START_TIME'
};

/**
 * This analyzer tests if the trip started earlier than scheduled using geographic data.
 * It uses the timestamp of the last event that is inside the geofence
 * of the first stop of the trip to determine the trip start time.
 *
 * GRADES:
 * → PASS = Trip started started at scheduled time or later.
 * → FAIL = Trip started earlier than scheduled.
 */
export function geoEarlyStartLastInAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
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

		const sortedVehicleEvents = analysisData.vehicle_events?.sort((a, b) => {
			return DateTime.fromJSDate(a.vehicle_timestamp).toMillis() - DateTime.fromJSDate(b.vehicle_timestamp).toMillis();
		});

		// 5.
		// For each point, check if they are inside the geofence or not
		// Record the last event that is inside the geofence

		let atLeastOneEventWasFoundInsideGeofense = false;

		let lastEventInsideGeofence = null;

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
				_id: 'GEO_EARLY_START_LAST_IN',
				grade: 'fail',
				message: 'No event was found inside the geofence of the first stop.',
				reason: 'NO_EVENT_INSIDE_GEOFENCE_FOUND',
				unit: null,
				value: null,
			};
		}

		// 6.
		// Check the timestamp of the event against the expected arrival time of the first stop

		const firstEventOutsideGeofenceTimestamp = lastEventInsideGeofence?.vehicle_timestamp;
		const firstEventOutsideGeofenceDateTimeObject = DateTime.fromJSDate(firstEventOutsideGeofenceTimestamp, { zone: 'Europe/Lisbon' });

		const delayInMinutes = firstEventOutsideGeofenceDateTimeObject.diff(expectedArrivalTimeDateTimeObject, 'minutes').minutes;

		// 7.
		// Return the result

		if (delayInMinutes < 0) {
			return {
				_id: 'GEO_EARLY_START_LAST_IN',
				grade: 'fail',
				message: `Trip started ${delayInMinutes} minutes earlier than scheduled.`,
				reason: 'TRIP_STARTED_EARLIER_THAN_SCHEDULED',
				unit: 'MINUTES_FROM_SCHEDULED_START_TIME',
				value: delayInMinutes,
			};
		}

		return {
			_id: 'GEO_EARLY_START_LAST_IN',
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
			_id: 'GEO_EARLY_START_LAST_IN',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
