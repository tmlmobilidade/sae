/* * */

import { createGeofence } from '@/utils/create-geofence.util.js';
import { isInsideGeofence } from '@/utils/is-inside-geofence.util.js';
import { sortByDate } from '@/utils/sort-by-date.util.js';
import { HashedTripWaypoint, VehicleEvent } from '@tmlmobilidade/core/types';

/**
 * The trip start time is the time of the last event inside the geofence of the first stop
 * that is before the first event inside the geofence of the second stop.
 * @param hashedTripWaypointsData
 * @param vehicleEventsData
 * @returns The event which starts the trip.
 */
export function detectStartEvent(hashedTripWaypointsData: HashedTripWaypoint[], vehicleEventsData: VehicleEvent[]): null | VehicleEvent {
	//

	//
	// Sort the path by stop_sequence and build a geofence
	// of 30 meters around the first and second stops of the trip.

	const sortedWaypoints = hashedTripWaypointsData.sort((a, b) => {
		return a.stop_sequence - b.stop_sequence;
	});

	if (sortedWaypoints.length < 2) {
		// throw new Error('Hashed Trip must have at least two stops.');
		return null;
	}

	const firstStopGeofence = createGeofence(Number(sortedWaypoints[0].stop_lon), Number(sortedWaypoints[0].stop_lat));
	const secondStopGeofence = createGeofence(Number(sortedWaypoints[1].stop_lon), Number(sortedWaypoints[1].stop_lat));

	//
	// Sort vehicle events by vehicle timestamp

	const sortedVehicleEvents = sortByDate(vehicleEventsData, 'created_at');

	//
	// Detect the first event that is inside the geofence of the second stop.

	let firstEventInsideSecondStop: null | VehicleEvent = null;

	for (const vehicleEventData of sortedVehicleEvents) {
		const vehicleEventIsInsideGeofenceOfSecondStop = isInsideGeofence(vehicleEventData.longitude, vehicleEventData.latitude, secondStopGeofence);
		if (vehicleEventIsInsideGeofenceOfSecondStop) {
			firstEventInsideSecondStop = vehicleEventData;
			break;
		}
	}

	if (firstEventInsideSecondStop === null) {
		// throw new Error('No vehicle event was found inside the geofence of the second stop.');
		return null;
	}

	//
	// Now detect the last event that is inside the geofence of the first stop,
	// and that is before one of the events found inside the geofence of the second or third stops.

	let lastEventInsideFirstStop: null | VehicleEvent = null;

	for (const vehicleEventData of sortedVehicleEvents) {
		const vehicleEventIsInsideGeofenceOfFirstStop = isInsideGeofence(vehicleEventData.longitude, vehicleEventData.latitude, firstStopGeofence);
		if (vehicleEventIsInsideGeofenceOfFirstStop) {
			// Check if the event is before the first event found inside the geofence of the second stop
			if (vehicleEventData.created_at < firstEventInsideSecondStop.created_at) {
				lastEventInsideFirstStop = vehicleEventData;
			}
			else break;
		}
	}

	if (lastEventInsideFirstStop === null) {
		// throw new Error('No vehicle event was found inside the geofence of the first stop.');
		return null;
	}

	//
	// Return the timestamp of the last event found inside the geofence of the first stop.
	// This will be used as the start time of the trip.

	return lastEventInsideFirstStop;

	//
}
