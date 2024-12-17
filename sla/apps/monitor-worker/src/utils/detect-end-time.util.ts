/* * */

import { sortByDate } from '@/utils/sort-by-date.util.js';
import { VehicleEvent } from '@tmlmobilidade/services/types';
import { DateTime } from 'luxon';

/**
 * Detect the end time of a trip based on the last vehicle event received.
 * If the last vehicle event was received more than two minutes ago, it is considered the end time.
 * Otherwise, it returns false as the trip is still ongoing.
 * @param vehicleEventsData
 * @returns Date | false
 */
export function detectEndTime(vehicleEventsData: VehicleEvent[]): Date | false {
	//

	//
	// Sort vehicle events by vehicle timestamp

	const sortedVehicleEvents = sortByDate(vehicleEventsData, 'created_at');

	//
	// Get the timestamp of the last event and check if more than two minutes have passed since then

	const lastVehicleEventReceived = sortedVehicleEvents[sortedVehicleEvents.length - 1];

	const timestampOfLastEvent = DateTime
		.fromJSDate(lastVehicleEventReceived.created_at)
		.toMillis();

	const twoMinutesAgo = DateTime
		.now()
		.minus({ minutes: 2 })
		.toMillis();

	if (timestampOfLastEvent < twoMinutesAgo) {
		return lastVehicleEventReceived.created_at;
	}

	return false;

	//
}
