/* * */

import { createPatternStopsSearchFilter, PATTERN_STOPS_SEARCH_PROJECTION } from '@/utils/pattern-stops-search.js';
import { HTTP_STATUS, HttpException } from '@tmlmobilidade/consts';
import { type FastifyReply, type FastifyRequest, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type PatternStopSearchItem, type PatternStopSearchQuery, PatternStopSearchQuerySchema } from '@tmlmobilidade/go-types-offer';

/**
 * Searches Stops by ID or name and returns a bounded list of compact results.
 * @param request The request object
 * @param reply The reply object
 */
export async function listPatternsStopsHandler(request: FastifyRequest<{ Querystring: PatternStopSearchQuery }>, reply: FastifyReply<PatternStopSearchItem[]>) {
	//

	const parsedQuery = PatternStopSearchQuerySchema.safeParse(request.query);
	if (!parsedQuery.success) {
		throw new HttpException(HTTP_STATUS.BAD_REQUEST, parsedQuery.error.message);
	}

	const foundStops = await goDb.infrastructure.stops.findMany(
		createPatternStopsSearchFilter(parsedQuery.data.query),
		{
			limit: parsedQuery.data.limit,
			projection: PATTERN_STOPS_SEARCH_PROJECTION,
		},
	);

	return sendSuccessApiResponse(reply, foundStops);
}
