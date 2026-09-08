/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type ControllerRidesDetailRideItem, ControllerRidesDetailRideItemSchema, controllerRidesDetailRideQuery } from '@tmlmobilidade/go-operation-pckg-types';

/**
 * Get a ride by its ID.
 * @param request The Fastify request object.
 * @param reply The Fastify reply object.
 */
export async function getRideHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply<ControllerRidesDetailRideItem>) {
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
	// Build query parameters

	const params: Record<string, number | string> = {
		1: request.params.id,
	};

	//
	// Execute the query

	const queryResult = await labDb.queryFromString<ControllerRidesDetailRideItem>(controllerRidesDetailRideQuery, params);

	//
	// Parse and return the result

	if (!queryResult?.length) {
		return sendErrorApiResponse(reply, {
			error: `Ride not found: ${request.params.id}`,
			status_code: '404',
		});
	}

	const parsedResult = ControllerRidesDetailRideItemSchema.parse(queryResult[0]);

	return sendSuccessApiResponse(reply, parsedResult);
}
