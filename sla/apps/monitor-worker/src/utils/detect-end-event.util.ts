/* * */

import { createGeofence } from '@/utils/create-geofence.util.js';
import { isInsideGeofence } from '@/utils/is-inside-geofence.util.js';
import { sortByDate } from '@tmlmobilidade/core/utils';
import { HashedTripWaypoint, VehicleEvent } from '@tmlmobilidade/core/types';

/**
 * The trip end time is the time of the first event inside the geofence of the last stop
 * that is after the last event inside the geofence of the last before last stop.
 * @param hashedTripWaypointsData
 * @param vehicleEventsData
 * @returns The event which ends the trip.
 */
export function detectEndEvent(hashedTripWaypointsData: HashedTripWaypoint[], vehicleEventsData: VehicleEvent[]): null | VehicleEvent {
	//

	//
	// Sort the path by stop_sequence and build a geofence
	// of 30 meters around the last and last before last stops of the trip.

	const sortedWaypoints = hashedTripWaypointsData.sort((a, b) => {
		return a.stop_sequence - b.stop_sequence;
	});

	if (sortedWaypoints.length < 2) {
		// throw new Error('Hashed Trip must have at least two stops.');
		return null;
	}

	const lastStopGeofence = createGeofence(Number(sortedWaypoints[sortedWaypoints.length - 1].stop_lon), Number(sortedWaypoints[sortedWaypoints.length - 1].stop_lat));
	const lastBeforeLastStopGeofence = createGeofence(Number(sortedWaypoints[sortedWaypoints.length - 2].stop_lon), Number(sortedWaypoints[sortedWaypoints.length - 2].stop_lat));

	//
	// Sort vehicle events by vehicle timestamp

	const sortedVehicleEvents = sortByDate(vehicleEventsData, 'created_at', 'desc');

	//
	// Detect the last event that is inside the geofence of the last before last stop.

	let lastEventInsideLastBeforeLastStop: null | VehicleEvent = null;

	for (const vehicleEventData of sortedVehicleEvents) {
		const vehicleEventIsInsideGeofenceOfLastBeforeLastStop = isInsideGeofence(vehicleEventData.longitude, vehicleEventData.latitude, lastBeforeLastStopGeofence);
		if (vehicleEventIsInsideGeofenceOfLastBeforeLastStop) {
			lastEventInsideLastBeforeLastStop = vehicleEventData;
			break;
		}
	}

	if (lastEventInsideLastBeforeLastStop === null) {
		// throw new Error('No vehicle event was found inside the geofence of the last before last stop.');
		return null;
	}

	//
	// Now detect the first event that is inside the geofence of the last stop,
	// and that is after one of the events found inside the geofence of the last before last stop.

	let firstEventInsideLastStop: null | VehicleEvent = null;

	for (const vehicleEventData of sortedVehicleEvents) {
		const vehicleEventIsInsideGeofenceOfFirstStop = isInsideGeofence(vehicleEventData.longitude, vehicleEventData.latitude, lastStopGeofence);
		if (vehicleEventIsInsideGeofenceOfFirstStop) {
			// Check if the event is after the last event found inside the geofence of the last before last stop
			if (vehicleEventData.created_at > lastEventInsideLastBeforeLastStop.created_at) {
				firstEventInsideLastStop = vehicleEventData;
			}
			else break;
		}
	}

	if (firstEventInsideLastStop === null) {
		// throw new Error('No vehicle event was found inside the geofence of the last stop.');
		return null;
	}

	//
	// Return the timestamp of the first event found inside the geofence of the last stop.
	// This will be used as the end time of the trip.

	return firstEventInsideLastStop;

	//
}
