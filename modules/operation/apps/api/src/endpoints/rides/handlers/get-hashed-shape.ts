/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type HashedShape, type Ride } from '@tmlmobilidade/go-types-operation';

/**
 * Get a HashedShape by Ride ID.
 * @param request The Fastify request object.
 * @param reply The Fastify reply object.
 */
export async function getHashedShapeHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply<HashedShape>) {
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

	const ridesQueryResult = await labDb.queryFromString<Pick<Ride, 'hashed_shape_id'>>(
		'SELECT hashed_shape_id FROM operation.rides WHERE _id = $1 ORDER BY updated_at DESC LIMIT 1 BY _id',
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

	const foundHashedShapeData = await labDb.operation.hashedShapes.select(
		'*',
		'_id = $1 ORDER BY updated_at DESC LIMIT 1 BY _id',
		{ 1: rideData.hashed_shape_id },
	);

	if (!foundHashedShapeData?.length) {
		return sendErrorApiResponse(reply, {
			error: 'Hashed Shape not found.',
			status_code: '404',
		});
	}

	return sendSuccessApiResponse(reply, foundHashedShapeData[0]);
}
