/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type AlertsStopsFilters, AlertsStopsFiltersSchema, type AlertsStopsItem, AlertsStopsItemSchema, AlertsStopsQueryRow } from '@tmlmobilidade/go-operation-pckg-types';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';

/**
 * Get stops by query.
 * @param request The Fastify request object.
 * @param reply The Fastify reply object.
 */
export async function listStops(request: FastifyRequest<{ Body: AlertsStopsFilters }>, reply: FastifyReply<AlertsStopsItem[]>) {
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
			error: 'User does not have permission to read stops for the selected agency.',
			status_code: '404',
		});
	}

	//
	// Validate the filters

	const validatedFilters = AlertsStopsFiltersSchema.parse(request.body);

	//
	// Build query parameters and execute the query

	const params: Record<string, number | string> = {
		agency_id: validatedFilters.agency_id,
		start_time_scheduled_end: validatedFilters.start_time_scheduled_end,
		start_time_scheduled_start: validatedFilters.start_time_scheduled_start,
	};

	const queryResult = await labDb.queryFromFile<AlertsStopsQueryRow>(sqlPath('operation', 'alerts/list-stops.sql'), params);

	//
	// Parse and return the result

	const parsedResult: AlertsStopsItem[] = queryResult
		.map(row => ({
			routes: row.routes
				.map(([routeLongName, routeShapeId, routeShortName]) => ({
					route_long_name: routeLongName,
					route_shape_id: routeShapeId,
					route_short_name: routeShortName,
				}))
				.sort((a, b) => a.route_short_name.localeCompare(b.route_short_name)),
			stop_id: row.stop_id,
			stop_lat: row.stop_lat,
			stop_lon: row.stop_lon,
			stop_name: row.stop_name,
		}))
		.sort((a, b) => a.stop_id.localeCompare(b.stop_id));

	const validatedResult = AlertsStopsItemSchema.array().parse(parsedResult);

	return sendSuccessApiResponse(reply, validatedResult);
}

