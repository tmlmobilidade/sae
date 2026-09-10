/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { type ExternalFeedConfig } from '../external-feeds.js';
import { getExternalTripUpdates } from '../gtfs/get-external-trip-updates.js';
import { type TripStopEta } from '../types.js';
import { loadTripScheduleIndex } from './trip-schedule-index.js';
import { tripUpdatesToEtas } from './trip-updates-to-etas.js';

/* * */

/**
 * Resolves display names for infrastructure stop IDs.
 *
 * @param stopIds - Internal stop `_id` values as strings
 * @returns Map of stop ID → stop name
 */
async function getStopNames(stopIds: string[]): Promise<Map<string, string>> {
	if (!stopIds.length) return new Map();

	const stops = await goDb.infrastructure.stops.findMany(
		{ _id: { $in: stopIds } },
		{ projection: { _id: 1, name: 1 } },
	);

	return new Map(stops.map(stop => [String(stop._id), stop.name]));
};

/**
 * Builds simplified trip-stop ETAs for an external GTFS-RT feed.
 *
 * Fetches TripUpdates via {@link getExternalTripUpdates}, loads that agency's
 * schedule index, resolves stop names, then converts updates with
 * {@link tripUpdatesToEtas}.
 *
 * @param feed - External feed config (agency, label, fetch fn)
 * @returns Flat {@link TripStopEta} rows ready for simplified ETA caches
 */
export async function getExternalEtas(feed: ExternalFeedConfig): Promise<TripStopEta[]> {
	//

	const timer = new Timer();

	Logger.info({ message: `Retrieving trip stop ETAs from ${feed.label} API...` });

	const [tripUpdates, scheduleIndex] = await Promise.all([
		getExternalTripUpdates(feed),
		loadTripScheduleIndex(feed.agencyId),
	]);
	const stopIds = [...new Set(tripUpdates.flatMap(tripUpdate =>
		(tripUpdate.stop_time_update ?? [])
			.map(stopTimeUpdate => stopTimeUpdate.stop_id)
			.filter((stopId): stopId is string => Boolean(stopId)),
	))];
	const stopNames = await getStopNames(stopIds);
	const etas = tripUpdatesToEtas(tripUpdates, stopNames, scheduleIndex);

	Logger.info({ message: `Found ${etas.length} ${feed.label} trip stop ETAs in ${timer.get()}`, spacesAfterOrBefore: 1 });

	return etas;

	//
};
