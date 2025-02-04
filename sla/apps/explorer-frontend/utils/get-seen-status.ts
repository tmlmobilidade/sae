/* * */

import { type RideDisplay } from '@/types/ride-display.type';
import { Ride } from '@tmlmobilidade/core/types';
import { DateTime } from 'luxon';

/**
 * This function returns the seen status of a ride based on the timestamp of its most recent event.
 * A ride is considered 'seen' if its most recent event is less than 30 seconds old;
 * 'gone' if its most recent event is more than 30 seconds old;
 * and 'unseen' if the ride has no events.
 * @param value
 * @returns
 */
export function getSeenStatus(value?: Ride['seen_last_at']): RideDisplay['seen_status'] {
	//

	if (!value) {
		return 'unseen';
	}

	const nowInUnixSeconds = DateTime.now().toUnixInteger();
	const lastSeenAtInUnixSeconds = DateTime.fromJSDate(value).toUnixInteger();

	const secondsFromLastSeenToNow = nowInUnixSeconds - lastSeenAtInUnixSeconds;

	if (secondsFromLastSeenToNow <= 30) {
		return 'seen';
	}

	return 'gone';

	//
}
