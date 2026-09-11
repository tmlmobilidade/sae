/* * */

import { cacheDb } from '@tmlmobilidade/go-interfaces-cachedb';
import { type HubV1ApiLine, type HubV1ApiPattern, type HubV1ApiScheduledArrival } from '@tmlmobilidade/go-types-hub';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

/**
 * Per-trip schedule lookup: trip ID → validity windows with stop-sequence maps.
 *
 * Built from hub pattern cache; used to backfill stop sequences and scheduled
 * arrival times when converting GTFS-RT TripUpdates to simplified ETAs.
 */
export type TripScheduleIndex = Map<string, { stops: Map<number, HubV1ApiScheduledArrival>, validOn: string[] }[]>;

/**
 * Parses a public/qualified trip ID of the form `[{planId}][{agencyId}]{tripId}`.
 *
 * @param publicTripId - Qualified trip ID (e.g. from external feeds)
 * @returns Plan, agency, and raw trip ID parts, or `undefined` if malformed
 */
export function parsePublicTripId(publicTripId: string): undefined | { agencyId: string, planId: string, tripId: string } {
	const match = publicTripId.match(/^\[([^\]]+)\]\[([^\]]+)\](.+)$/);
	if (!match) return undefined;

	return { agencyId: match[2], planId: match[1], tripId: match[3] };
};

/**
 * Extracts the `_YYYYMMDD` service date suffix from a raw trip ID, if present.
 *
 * @param tripId - Unqualified trip ID (may include a trailing date)
 * @returns Eight-digit operational date string, or `undefined`
 */
export function parseServiceDateFromTripId(tripId: string): string | undefined {
	return tripId.match(/_(\d{8})$/)?.[1];
};

/**
 * Converts a GTFS `HH:MM:SS` arrival time on an operational date to unix ms
 * in `Europe/Lisbon` (supports times past midnight via hour overflow).
 */
function gtfsArrivalTimeToUnixMs(operationalDate: string, arrivalTime: string): number {
	const [hours, minutes, seconds = 0] = arrivalTime.split(':').map(Number);

	return Dates.fromOperationalDateInt(operationalDate, 'Europe/Lisbon')
		.plus({ hours, minutes, seconds })
		.unix_milliseconds;
};

/** Indexes pattern groups into a {@link TripScheduleIndex} keyed by trip ID. */
function indexPatterns(patternGroups: HubV1ApiPattern[]): TripScheduleIndex {
	const index: TripScheduleIndex = new Map();

	for (const patternGroup of patternGroups) {
		for (const trip of patternGroup.trips) {
			const stops = new Map(trip.schedule.map(schedule => [schedule.stop_sequence, schedule]));

			for (const tripId of trip.trip_ids) {
				const entries = index.get(tripId) ?? [];
				entries.push({ stops, validOn: trip.valid_on.map(validOn => validOn.toString()) });
				index.set(tripId, entries);
			}
		}
	}

	return index;
};

/**
 * Loads a {@link TripScheduleIndex} for one agency from the hub network cache.
 *
 * Reads `hub:v1:network:lines`, filters by `agencyId`, then loads each
 * pattern's `hub:v1:network:patterns:{patternId}` blob. Returns an empty
 * map if the lines cache is missing.
 *
 * @param agencyId - Agency whose patterns to index
 */
export async function loadTripScheduleIndex(agencyId: string): Promise<TripScheduleIndex> {
	const linesRaw = await cacheDb.get('hub:v1:network:lines');
	if (!linesRaw) return new Map();

	const patternIds = [...new Set(
		(JSON.parse(linesRaw) as HubV1ApiLine[])
			.filter(line => line.agency_id === agencyId)
			.flatMap(line => line.pattern_ids),
	)];

	const patternGroups = (await Promise.all(patternIds.map(async (patternId) => {
		const raw = await cacheDb.get(`hub:v1:network:patterns:${patternId}`);
		return raw ? JSON.parse(raw) as HubV1ApiPattern[] : [];
	}))).flat();

	return indexPatterns(patternGroups);
};

/**
 * Looks up the scheduled stop for a trip on a given operational date.
 *
 * Prefers `stopSequence` when present in the index; otherwise falls back to
 * matching by `stopId`.
 *
 * @returns The matching {@link HubV1ApiScheduledArrival}, or `undefined`
 */
export function getScheduledArrival(
	scheduleIndex: TripScheduleIndex,
	tripId: string,
	operationalDate: string,
	stopSequence?: number,
	stopId?: string,
): HubV1ApiScheduledArrival | undefined {
	const entry = scheduleIndex.get(tripId)?.find(item => item.validOn.includes(operationalDate));
	if (!entry) return undefined;

	if (stopSequence != null && entry.stops.has(stopSequence)) {
		return entry.stops.get(stopSequence);
	}

	if (stopId) {
		return [...entry.stops.values()].find(schedule => schedule.stop_id === stopId);
	}

	return undefined;
};

/**
 * Scheduled arrival as unix seconds for a trip stop on an operational date.
 *
 * @returns Unix seconds, or `undefined` if no schedule entry exists
 */
export function getScheduledArrivalUnix(
	scheduleIndex: TripScheduleIndex,
	tripId: string,
	stopSequence: number,
	operationalDate: string,
	stopId?: string,
): number | undefined {
	const schedule = getScheduledArrival(scheduleIndex, tripId, operationalDate, stopSequence, stopId);
	if (!schedule) return undefined;

	return Math.floor(gtfsArrivalTimeToUnixMs(operationalDate, schedule.arrival_time) / 1000);
};

/**
 * Resolves the operational date for a (possibly qualified) trip ID.
 *
 * Uses the `_YYYYMMDD` suffix when present; otherwise today's date in
 * `Europe/Lisbon`.
 */
export function resolveOperationalDate(tripId: string): string {
	return parseServiceDateFromTripId(parsePublicTripId(tripId)?.tripId ?? tripId) ?? Dates.now('Europe/Lisbon').operational_date_int.toString();
};
