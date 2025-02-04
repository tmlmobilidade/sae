/* * */

import { type Ride, type VehicleEvent } from '@tmlmobilidade/core/types';
import { DateTime } from 'luxon';

import { sortByDate } from './sort-by-date.util.js';

/**
 * This function returns the correct operational status for a given Ride, base on its scheduled_start_time and VehicleEvents data.
 * A Ride can be considered 'scheduled', 'missed', 'running' or 'ended'.
 * Value 'scheduled' means that the ride start time is still in the future, and no VehicleEvents were found for it.
 * Value 'missed' means that the ride start time is at least 10 minutes ago, and no VehicleEvents were found for it.
 * Value 'running' means that there are VehicleEvents for the ride, and the most recent one was received less than 10 minutes ago.
 * Value 'ended' means that there are VehicleEvents for the ride, and the most recent one was received more than 10 minutes ago.
 * @param rideData The Ride to be analyzed.
 * @param vehicleEventsData The VehicleEvents data for the Ride.
 * @returns The operational status for the Ride.
 */
export function getOperationalStatus(rideData: Ride, vehicleEventsData: VehicleEvent[]): Ride['operational_status'] {
	//

	//
	// Check if the ride start time is in the future.

	const nowInUnixSeconds = DateTime.now().toUnixInteger();
	const rideStartTimeInUnixSeconds = DateTime.fromJSDate(rideData.start_time_scheduled).toUnixInteger();

	const secondsFromRideStartToNow = nowInUnixSeconds - rideStartTimeInUnixSeconds;

	//
	// If the ride start time is less than or equal to 10 minutes ago, or in the future,
	// and there are no VehicleEvents for it, then the ride is considered 'scheduled'.

	if (secondsFromRideStartToNow <= 600 && !vehicleEventsData.length) {
		return 'scheduled';
	}

	//
	// If the ride start time is at least 10 minutes ago, and there are no VehicleEvents for it,
	// then the ride is considered 'missed' and no further analysis is needed.

	if (secondsFromRideStartToNow > 600 && !vehicleEventsData.length) {
		return 'missed';
	}

	//
	// If there are VehicleEvents for the ride, and the most recent one was received less than or exactly at 10 minutes ago,
	// then the ride is considered 'running'. Else it is considered 'ended'.

	const mostRecentVehicleEvent = sortByDate(vehicleEventsData, 'created_at', 'desc')[0];

	const mostRecentVehicleEventInUnixSeconds = DateTime.fromJSDate(mostRecentVehicleEvent.created_at).toUnixInteger();
	const secondsFromMostRecentVehicleEventToNow = nowInUnixSeconds - mostRecentVehicleEventInUnixSeconds;

	if (secondsFromMostRecentVehicleEventToNow <= 600) {
		return 'running';
	}

	return 'ended';

	//
}
