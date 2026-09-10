/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type AlertsLinesFilters, AlertsLinesFiltersSchema, type AlertsLinesItem, AlertsLinesItemSchema, AlertsLinesQueryRow } from '@tmlmobilidade/go-operation-pckg-types';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';

/**
 * Get lines by query.
 * @param request The Fastify request object.
 * @param reply The Fastify reply object.
 */
export async function listLines(request: FastifyRequest<{ Body: AlertsLinesFilters }>, reply: FastifyReply<AlertsLinesItem[]>) {
	//

	//
	// Apply permission filters to the request body

	const allowedAgencyIds = PermissionCatalog.filterPermissionResourceValues<string>({
		action: PermissionCatalog.all.alerts.actions.read,
		permissions: request.permissions,
		resourceKey: 'agency_ids',
		scope: PermissionCatalog.all.alerts.scope,
		values: [request.body.agency_id],
	});

	if (!allowedAgencyIds.length) {
		return sendErrorApiResponse(reply, {
			error: 'User does not have permission to read lines for the selected agency.',
			status_code: '404',
		});
	}

	//
	// Validate the filters

	const validatedFilters = AlertsLinesFiltersSchema.parse(request.body);

	//
	// Build query parameters and execute the query

	const params: Record<string, number | string> = {
		agency_id: validatedFilters.agency_id,
		start_time_scheduled_end: validatedFilters.start_time_scheduled_end,
		start_time_scheduled_start: validatedFilters.start_time_scheduled_start,
	};

	const queryResult = await labDb.queryFromFile<AlertsLinesQueryRow>(sqlPath('operation', 'alerts/list-lines.sql'), params);

	//
	// Parse and return the result

	const parsedResult: AlertsLinesItem[] = queryResult
		.map(row => ({
			agency_id: row.agency_id,
			patterns: row.patterns
				.map(([headsign, routeId, shapeId, stops]) => ({
					headsign,
					route_id: routeId,
					shape_id: shapeId,
					stops: stops.map(([stopId, stopName]) => ({
						stop_id: stopId,
						stop_name: stopName,
					})),
				}))
				.sort((a, b) => a.shape_id.localeCompare(b.shape_id)),
			route_long_name: row.route_long_name,
			route_short_name: row.route_short_name,
		}))
		.sort((a, b) => a.route_short_name.localeCompare(b.route_short_name));

	const validatedResult = AlertsLinesItemSchema.array().parse(parsedResult);

	return sendSuccessApiResponse(reply, validatedResult);
}

