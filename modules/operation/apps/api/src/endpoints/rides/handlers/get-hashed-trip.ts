/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type HashedTrip, type Ride } from '@tmlmobilidade/go-types-operation';

/**
 * Get a HashedTrip by Ride ID.
 * @param request The Fastify request object.
 * @param reply The Fastify reply object.
 */
export async function getHashedTripHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply<HashedTrip[]>) {
	//

	//
	// Validate the request parameters

	if (!request.params.id) {
		return sendErrorApiResponse(reply, {
			error: 'Missing ride "id" parameter.',
			status_code: '400',
		});
	}

	//
	// Fetch the ride data from the database

	const ridesQueryResult = await labDb.queryFromString<Pick<Ride, 'hashed_trip_id'>>(
		'SELECT hashed_trip_id FROM operation.rides WHERE _id = $1 ORDER BY updated_at DESC LIMIT 1 BY _id',
		{ 1: request.params.id },
	);

	if (!ridesQueryResult?.length) {
		return sendErrorApiResponse(reply, {
			error: 'Ride not found.',
			status_code: '404',
		});
	}

	const rideData = ridesQueryResult[0];

	//
	// Fetch the hashed trip data by ride ID
	// and send it back to the client

	const foundHashedTripData = await labDb.operation.hashedTrips.select(
		'*',
		'_id = $1 ORDER BY updated_at DESC LIMIT 1 BY _id, stop_sequence',
		{ 1: rideData.hashed_trip_id },
	);

	if (!foundHashedTripData?.length) {
		return sendErrorApiResponse(reply, {
			error: 'Hashed Trip not found.',
			status_code: '404',
		});
	}

	return sendSuccessApiResponse(reply, foundHashedTripData);
}
