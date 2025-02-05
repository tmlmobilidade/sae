/* * */

import { Ride } from '@tmlmobilidade/core/types';

/* * */

export interface RideDisplay {

	_ride: Ride

	/**
	 * A Ride is considered "seen" if the last event was received less than 30 seconds ago,
	 * and "gone" if the last event was received more than 30 seconds ago.
	 * Status "unseen" is used for rides for which no events have been received.
	 */
	operational_status: 'completed' | 'missed' | 'running' | 'scheduled'

	/**
	 * A Ride is considered "seen" if the last event was received less than 30 seconds ago,
	 * and "gone" if the last event was received more than 30 seconds ago.
	 * Status "unseen" is used for rides for which no events have been received.
	 */
	seen_status: 'gone' | 'seen' | 'unseen'

}
