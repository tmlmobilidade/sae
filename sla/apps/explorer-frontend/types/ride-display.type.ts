/* * */

import { Ride } from '@tmlmobilidade/core/types';

/* * */

export interface RideDisplay {

	_ride: Ride

	/**
	 * Execution status indicates if the ride is being executed or not. This differs from seen_status
	 * because a ride can be seen but not being executed, for example if it is scheduled for the future.
	 * Or, a ride can be unseen but being executed, for example if there is a momentary loss of connection.
	 * - 'scheduled': The ride is planned to start in the future.
	 * - 'running': The ride has left the first stop
	 */
	execution_status: 'ended' | 'missed' | 'running' | 'scheduled' | 'unstarted'

	/**
	 * A Ride is considered "seen" if the last event was received less than 30 seconds ago,
	 * and "gone" if the last event was received more than 30 seconds ago.
	 * Status "unseen" is used for rides for which no events have been received.
	 */
	seen_status: 'gone' | 'seen' | 'unseen'

}
