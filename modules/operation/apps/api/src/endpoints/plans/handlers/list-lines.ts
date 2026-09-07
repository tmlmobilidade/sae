/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { type AggregationPipeline } from '@tmlmobilidade/go-clients-mongo';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type PlansLinesItem, PlansLinesItemSchema, type PlansLinesRequest, PlansLinesRequestSchema } from '@tmlmobilidade/go-operation-pckg-types';
import { AllowAllFlagValue } from '@tmlmobilidade/go-types-permissions';

/**
 * List lines available to the Plans poster export flow.
 * @param request The Fastify request object.
 * @param reply The Fastify reply object.
 */
export async function listLines(request: FastifyRequest<{ Body: PlansLinesRequest }>, reply: FastifyReply<PlansLinesItem[]>) {
	//

	//
	// Validate the request

	const validatedRequest = PlansLinesRequestSchema.parse(request.body);

	//
	// Get the agency IDs from the requested permissions

	const resourceAgencyIds = validatedRequest.permissions.actions?.flatMap(action => request.permissions
		.filter(permission => permission.scope === validatedRequest.permissions.scope && permission.action === action)
		.flatMap(permission => 'resources' in permission ? permission.resources.agency_ids ?? [] : []),
	) ?? [];

	const canAccessAgency = resourceAgencyIds.includes(AllowAllFlagValue) || resourceAgencyIds.includes(validatedRequest.agency_id);

	if (!canAccessAgency) {
		return sendErrorApiResponse(reply, {
			error: 'No lines found for the selected agency and permissions',
			status_code: '404',
		});
	}

	//
	// Fetch and project the lines for the selected agency

	const pipeline: AggregationPipeline<PlansLinesItem> = [
		{ $match: { agency_id: validatedRequest.agency_id } },
		{ $project: Object.fromEntries(Object.keys(PlansLinesItemSchema.shape).map(key => [key, 1])) },
		{ $sort: { code: 1 } },
	];

	const aggregationResult = await goDb.offer.lines.aggregate(pipeline);

	if (!aggregationResult?.length) {
		return sendErrorApiResponse(reply, {
			error: 'No lines found for the selected agency',
			status_code: '404',
		});
	}

	return sendSuccessApiResponse(reply, PlansLinesItemSchema.array().parse(aggregationResult));
}
