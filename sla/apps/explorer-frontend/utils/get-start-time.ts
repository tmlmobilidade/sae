/* * */

import { type Ride } from '@tmlmobilidade/core/types';
import { DateTime } from 'luxon';

/**
 * This function extract the hour and minute components from a date string.
 * @param timestamp - The date string to extract the hour and minute components from.
 * @returns The hour and minute components of the date string.
 */
export function getStartTime(timestamp: Ride['start_time_observed'] | Ride['start_time_scheduled']): string {
	//

	return DateTime.fromJSDate(new Date(timestamp)).toFormat('HH:mm');

	//
}
