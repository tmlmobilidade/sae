/* * */

import { Dates } from '@tmlmobilidade/go-utils-dates';
import { type GtfsRtStopTimeEvent, type GtfsRtTripUpdate } from '@tmlmobilidade/go-types-gtfs-rt';

import { type TripStopEta } from '../types.js';
import { getScheduledArrival, getScheduledArrivalUnix, resolveOperationalDate, type TripScheduleIndex } from './trip-schedule-index.js';

/* * */

/**
 * Resolves a stop-time event to unix seconds.
 *
 * Prefers absolute `time`; otherwise applies `delay` to the event's
 * `scheduled_time` or the provided schedule-backed `scheduledUnix`.
 */
function getStopTimeEventUnix(
	event: GtfsRtStopTimeEvent | undefined,
	scheduledUnix?: number,
): number | undefined {
	if (!event) return undefined;
	if (event.time != null) return event.time;

	const scheduledTime = (event as { scheduled_time?: number }).scheduled_time;
	if (scheduledTime != null && event.delay != null) return scheduledTime + event.delay;
	if (scheduledUnix != null && event.delay != null) return scheduledUnix + event.delay;

	return undefined;
};

/** Groups flat ETAs by `trip_id`. */
export function groupEtasByTrip(etas: TripStopEta[]): Map<string, TripStopEta[]> {
	const byTrip = new Map<string, TripStopEta[]>();

	for (const eta of etas) {
		const tripEtas = byTrip.get(eta.trip_id) ?? [];
		tripEtas.push(eta);
		byTrip.set(eta.trip_id, tripEtas);
	}

	return byTrip;
};

/** Groups flat ETAs by `stop_id`. */
export function groupEtasByStop(etas: TripStopEta[]): Map<string, TripStopEta[]> {
	const byStop = new Map<string, TripStopEta[]>();

	for (const eta of etas) {
		const stopEtas = byStop.get(eta.stop_id) ?? [];
		stopEtas.push(eta);
		byStop.set(eta.stop_id, stopEtas);
	}

	return byStop;
};

/**
 * Converts one GTFS-RT TripUpdate into flat simplified {@link TripStopEta} rows.
 *
 * For each stop-time update with a `stop_id`, resolves arrival (or departure)
 * unix time — using absolute `time`, or delay against schedule when a
 * {@link TripScheduleIndex} is provided — and computes `eta_seconds` from now.
 * Skips stops with no resolvable arrival time. Backfills `stop_sequence` from
 * the schedule when the feed omits it.
 *
 * @param tripUpdate - Source TripUpdate (qualified `trip_id`, internal stop IDs)
 * @param stopNames - Optional stop ID → display name map
 * @param scheduleIndex - Optional schedule index for delay/sequence backfill
 */
export function tripUpdateToEtas(
	tripUpdate: GtfsRtTripUpdate,
	stopNames: ReadonlyMap<string, string> = new Map(),
	scheduleIndex?: TripScheduleIndex,
): TripStopEta[] {
	const tripId = tripUpdate.trip?.trip_id;
	if (!tripId) return [];

	const vehicleId = tripUpdate.vehicle?.id ?? '';
	const operationalDate = resolveOperationalDate(tripId);
	const nowUnix = Dates.now('Europe/Lisbon').unix_milliseconds / 1000;
	const etas: TripStopEta[] = [];

	for (const stopTimeUpdate of tripUpdate.stop_time_update ?? []) {
		if (!stopTimeUpdate.stop_id) continue;

		const scheduledArrival = scheduleIndex
			? getScheduledArrival(
				scheduleIndex,
				tripId,
				operationalDate,
				stopTimeUpdate.stop_sequence ?? undefined,
				stopTimeUpdate.stop_id,
			)
			: undefined;
		const stopSequence = stopTimeUpdate.stop_sequence ?? scheduledArrival?.stop_sequence ?? 0;
		const scheduledUnix = scheduleIndex
			? getScheduledArrivalUnix(
				scheduleIndex,
				tripId,
				stopSequence,
				operationalDate,
				stopTimeUpdate.stop_id,
			)
			: undefined;
		const arrivalUnix = getStopTimeEventUnix(stopTimeUpdate.arrival, scheduledUnix) ?? getStopTimeEventUnix(stopTimeUpdate.departure, scheduledUnix);
		if (arrivalUnix == null) continue;

		etas.push({
			eta_at: arrivalUnix * 1000,
			eta_seconds: Math.max(0, Math.round(arrivalUnix - nowUnix)),
			stop_id: stopTimeUpdate.stop_id,
			stop_name: stopNames.get(stopTimeUpdate.stop_id) ?? '',
			stop_sequence: stopSequence,
			trip_id: tripId,
			vehicle_id: vehicleId,
		});
	}

	return etas;
};

/**
 * Converts many GTFS-RT TripUpdates into flat simplified {@link TripStopEta} rows.
 *
 * @see {@link tripUpdateToEtas}
 */
export function tripUpdatesToEtas(
	tripUpdates: GtfsRtTripUpdate[],
	stopNames: ReadonlyMap<string, string> = new Map(),
	scheduleIndex?: TripScheduleIndex,
): TripStopEta[] {
	return tripUpdates.flatMap(tripUpdate => tripUpdateToEtas(tripUpdate, stopNames, scheduleIndex));
};
