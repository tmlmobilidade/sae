/* * */

import { ExtendedRideDisplay } from '@/contexts/Rides.context';
import { type Ride } from '@tmlmobilidade/core/types';
import { DateTime } from 'luxon';

/**
 * This function extract the hour and minute components from a date string.
 * @param timestamp - The date string to extract the hour and minute components from.
 * @returns The hour and minute components of the date string.
 */
export function getDelayStatus(startTimeScheduled: Ride['start_time_scheduled'], startTimeObserved: Ride['start_time_observed']): ExtendedRideDisplay['delay_status'] {
	//

	if (!startTimeScheduled || !startTimeObserved) {
		return null;
	}

	const scheduledTime = DateTime.fromJSDate(new Date(startTimeScheduled));
	const observedTime = DateTime.fromJSDate(new Date(startTimeObserved));

	const difference = observedTime.diff(scheduledTime, 'minutes').minutes;

	if (difference > 5) {
		return 'delayed';
	}

	if (difference < -1) {
		return 'early';
	}

	return 'ontime';

	//
}
