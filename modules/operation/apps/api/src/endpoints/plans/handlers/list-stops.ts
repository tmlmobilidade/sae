/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type PlansStopsItem, PlansStopsItemSchema, type PlansStopsRequest, PlansStopsRequestSchema } from '@tmlmobilidade/go-operation-pckg-types';
import { AllowAllFlagValue } from '@tmlmobilidade/go-types-permissions';

/**
 * List stops available to the Plans poster export flow.
 * @param request The Fastify request object.
 * @param reply The Fastify reply object.
 */
export async function listStops(request: FastifyRequest<{ Body: PlansStopsRequest }>, reply: FastifyReply<PlansStopsItem[]>) {
	//

	//
	// Validate the request

	const validatedRequest = PlansStopsRequestSchema.parse(request.body);

	//
	// Get the agency IDs from the requested permissions

	const resourceAgencyIds = validatedRequest.permissions.actions?.flatMap(action => request.permissions
		.filter(permission => permission.scope === validatedRequest.permissions.scope && permission.action === action)
		.flatMap(permission => 'resources' in permission ? permission.resources.agency_ids ?? [] : []),
	) ?? [];

	const canAccessAgency = resourceAgencyIds.includes(AllowAllFlagValue) || resourceAgencyIds.includes(validatedRequest.agency_id);

	if (!canAccessAgency) {
		return sendErrorApiResponse(reply, {
			error: 'No stops found for the selected agency and permissions',
			status_code: '404',
		});
	}

	//
	// Fetch the stops and expose the agency-specific ID used in the Plan GTFS.

	const stops = await goDb.infrastructure.stops.findMany(
		{ 'flags.agency_ids': { $in: [validatedRequest.agency_id] }, 'is_deleted': false },
		{ projection: { _id: 1, flags: 1, name: 1, short_name: 1 }, sort: { name: 1 } },
	);

	const stopItems: PlansStopsItem[] = stops.flatMap(stop => stop.flags
		.filter(flag => flag.agency_ids.includes(validatedRequest.agency_id))
		.map(flag => ({
			_id: stop._id,
			name: stop.name,
			short_name: stop.short_name,
			stop_id: flag.stop_id,
		})),
	);

	if (!stopItems.length) {
		return sendErrorApiResponse(reply, {
			error: 'No stops found for the selected agency',
			status_code: '404',
		});
	}

	return sendSuccessApiResponse(reply, PlansStopsItemSchema.array().parse(stopItems));
}
