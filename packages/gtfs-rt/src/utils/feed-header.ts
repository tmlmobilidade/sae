/* * */

import { type GtfsRtFeedMessage } from '@tmlmobilidade/go-types-gtfs-rt';
import { UnixSecondsSchema } from '@tmlmobilidade/go-types-shared';

/**
 * Returns an empty GTFS-RT feed message.
 * Useful for returning an empty feed when
 * there are no active alerts.
 * @returns An empty GTFS-RT feed message object.
 */
export function getEmptyGtfsRtFeedMessage(): GtfsRtFeedMessage {
	return {
		entity: [],
		header: {
			gtfs_realtime_version: '2.0',
			incrementality: 'FULL_DATASET',
			timestamp: UnixSecondsSchema.parse(Math.floor(new Date().getTime() / 1000)),
		},
	};
}
