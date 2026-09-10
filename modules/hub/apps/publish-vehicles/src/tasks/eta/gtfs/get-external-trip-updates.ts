/* * */

import { getQualifiedTripId } from '@tmlmobilidade/go-hub-pckg-utils';
import { cacheDb } from '@tmlmobilidade/go-interfaces-cachedb';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type GtfsRtTripUpdate } from '@tmlmobilidade/go-types-gtfs-rt';
import { type HubV1ApiPlan } from '@tmlmobilidade/go-types-hub';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { type ExternalFeedConfig } from '../external-feeds.js';

/* * */

/**
 * Fetches and normalizes GTFS-RT TripUpdates from an external feed.
 *
 * Looks up the agency's active hub plan, remaps each entity's stop IDs to
 * internal infrastructure `_id`s, and qualifies `trip_id` with
 * `[{planId}][{agencyId}]{externalTripId}`. Entities with no mappable stops
 * are dropped. On failure, logs and returns an empty array.
 *
 * @param feed - External feed config (agency, label, fetch fn)
 * @returns Normalized TripUpdates ready for GTFS-RT ETA caches
 */
export async function getExternalTripUpdates(feed: ExternalFeedConfig): Promise<GtfsRtTripUpdate[]> {
	//

	const timer = new Timer();

	Logger.info({ message: `Retrieving Estimated Time of Arrivals from ${feed.label} API...` });

	try {
		const approvedPlans = await cacheDb.get('hub:v1:plans:approved:json');
		if (!approvedPlans) throw new Error('No approved plans found in API Cache');

		const activePlanId = (JSON.parse(approvedPlans) as HubV1ApiPlan[])
			.find(plan => plan.is_active && plan.agency_id === feed.agencyId)
			?._id;

		if (!activePlanId) throw new Error(`No active plan found for agency ID: ${feed.agencyId}`);

		const externalFeed = await feed.fetchTripUpdates();
		const stopIdCache = new Map<string, null | string>();
		const tripUpdates: GtfsRtTripUpdate[] = [];

		/**
		 * Processes entities from the external GTFS-RT feed, remapping stop IDs and qualifying trip IDs.
		 *
		 * For each trip update entity:
		 * - Skips if missing a trip update or external trip ID.
		 * - For each stop time update:
		 *    - Looks up the corresponding internal stop ID, caching results.
		 *    - Skips and logs if the stop cannot be mapped to an internal stop ID.
		 *    - Rewrites the stop_time_update with the internal stop ID if found.
		 * - If at least one stop time update is valid:
		 *    - Rewrites the trip update with mapped stop time updates and a qualified trip_id.
		 *    - Appends it to the outgoing tripUpdates list.
		 * Skips entities where none of the stops can be mapped.
		 */
		for (const entity of externalFeed.entity ?? []) {
			const tripUpdate = entity.trip_update;
			const externalTripId = tripUpdate?.trip?.trip_id;
			if (!tripUpdate || !externalTripId) continue;

			const stopTimeUpdates = [];

			for (const stopTimeUpdate of tripUpdate.stop_time_update ?? []) {
				if (!stopTimeUpdate.stop_id) continue;

				let internalStopId = stopIdCache.get(stopTimeUpdate.stop_id);
				if (internalStopId === undefined) {
					const foundStop = await goDb.infrastructure.stops.findOne(
						{ 'flags.agency_ids': { $in: [feed.agencyId] }, 'flags.stop_id': stopTimeUpdate.stop_id },
						{ projection: { _id: 1 } },
					);
					internalStopId = foundStop ? String(foundStop._id) : null;
					stopIdCache.set(stopTimeUpdate.stop_id, internalStopId);
				}

				if (!internalStopId) {
					Logger.error({ message: `${feed.label} stop ID ${stopTimeUpdate.stop_id} not found.` });
					continue;
				}

				stopTimeUpdates.push({ ...stopTimeUpdate, stop_id: internalStopId });
			}

			if (!stopTimeUpdates.length) continue;

			tripUpdates.push({
				...tripUpdate,
				stop_time_update: stopTimeUpdates,
				trip: {
					...tripUpdate.trip,
					trip_id: getQualifiedTripId(activePlanId, feed.agencyId, externalTripId),
				},
			});
		}

		Logger.info({ message: `Found ${tripUpdates.length} ${feed.label} trip updates in ${timer.get()}`, spacesAfterOrBefore: 1 });

		return tripUpdates;
	} catch (error) {
		Logger.error({ error, message: `Failed to retrieve ${feed.label} trip updates in ${timer.get()}` });
		return [];
	}

	//
};
