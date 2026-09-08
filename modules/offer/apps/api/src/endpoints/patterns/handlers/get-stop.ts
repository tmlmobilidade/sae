/* * */

import { HTTP_STATUS, HttpException } from '@tmlmobilidade/consts';
import { type FastifyReply, type FastifyRequest, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type Stop, StopIdSchema } from '@tmlmobilidade/go-types-infrastructure';

/* * */

/**
 * Returns a stop by ID for pattern shape editing.
 * @param request The request object
 * @param reply The reply object
 */
export async function getPatternStopHandler(request: FastifyRequest<{ Params: { stopId: string } }>, reply: FastifyReply<Stop>) {
	//

	const parsedStopId = StopIdSchema.safeParse(request.params.stopId);
	if (!parsedStopId.success) {
		throw new HttpException(HTTP_STATUS.BAD_REQUEST, parsedStopId.error.message);
	}

	const foundStop = await goDb.infrastructure.stops.findById(parsedStopId.data);
	if (!foundStop) {
		throw new HttpException(HTTP_STATUS.NOT_FOUND, 'Stop not found.');
	}

	return sendSuccessApiResponse(reply, foundStop);
}
