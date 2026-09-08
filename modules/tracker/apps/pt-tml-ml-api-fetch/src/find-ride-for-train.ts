/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type Dates } from '@tmlmobilidade/go-utils-dates';

import { enrichTripPathWithStopCodes } from './enrich-trip-path-with-stop-codes.js';
import { findHashedShapeQuery, findHashedTripQuery, findRidesForTrainQuery } from './find-rides-for-train-query.js';
import { type AggregationResult, ML_AGENCY_ID } from './types.js';

/* * */

interface FindRideForTrainParams {
	destinationId: string
	now: Dates
}

/**
 * Finds a single Metro Lisboa ride, joining its shape and trip, whose headsign matches the
 * specified destinationId (ML API stop identifier) within a time window centered on the current timestamp.
 *
 * Searches for a stop document whose flags include the given destinationId (Metro agency IA2N9).
 * Uses the matched stop's name to filter rides by headsign, and limits the scheduled start time search to
 * one hour before and after the provided 'now' timestamp.
 *
 * Returns the middle ride match (if any) joined with its GTFS shape and trip, or null if none found.
 *
 * @param params.destinationId - ML API stop_id for the train's destination (string, agency IA2N9).
 * @param params.now - Current Dates instance (reference time zone aware).
 * @returns The AggregationResult object with shape and trip, or null if no match.
 *
 * Used by ml-fetch to map API train positions to GTFS rides for downstream vehicle event construction.
 */
export async function findRideForTrain({ destinationId, now }: FindRideForTrainParams): Promise<AggregationResult | null> {
	const destinationStop = await goDb.infrastructure.stops.findOne({
		flags: { $elemMatch: { agency_ids: ML_AGENCY_ID, stop_id: destinationId } },
	});

	if (!destinationStop) return null;

	const rides = await labDb.operation.rides.queryFromString(findRidesForTrainQuery, {
		1: ML_AGENCY_ID,
		2: destinationStop.name,
		3: now.minus({ hours: 1 }).unix_milliseconds,
		4: now.plus({ hours: 1 }).unix_milliseconds,
	});

	const ride = rides[Math.floor(rides.length / 2)];
	if (!ride) return null;

	const path = await labDb.operation.hashedTrips.queryFromString(findHashedTripQuery, { 1: ride.hashed_trip_id });
	if (!path.length) return null;

	const shape = await labDb.operation.hashedShapes.queryFromString(findHashedShapeQuery, { 1: ride.hashed_shape_id });
	if (!shape.length) return null;

	return {
		_id: ride._id,
		hashed_trip: { path: await enrichTripPathWithStopCodes(path) },
		shape_polyline: shape[0].shape_polyline,
		trip_id: ride.trip_id,
	};
}
