/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type AlertsRidesFilters, AlertsRidesFiltersSchema, type AlertsRidesItem } from '@tmlmobilidade/go-operation-pckg-types';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';
import { readFile } from 'node:fs/promises';

/**
 * Get rides by query.
 * @param request The Fastify request object.
 * @param reply The Fastify reply object.
 */
export async function listRides(request: FastifyRequest<{ Body: AlertsRidesFilters }>, reply: FastifyReply<AlertsRidesItem[]>) {
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
			error: 'User does not have permission to read rides for the selected agency.',
			status_code: '404',
		});
	}

	//
	// Validate the filters

	const validatedFilters = AlertsRidesFiltersSchema.parse(request.body);

	//
	// Build query parameters

	const params: Record<string, number | string> = {
		1: validatedFilters.agency_id,
		2: validatedFilters.start_time_scheduled_start,
		3: validatedFilters.start_time_scheduled_end,
	};

	//
	// Build WHERE conditions

	const conditions: string[] = [];

	//
	// Append the dynamic filters to the query

	const where = conditions.length
		? `\n\tAND ${conditions.join('\n\tAND ')}`
		: '';

	const queryTemplate = await readFile(sqlPath('operation', 'alerts/list-rides.sql'), 'utf-8');
	const sql = queryTemplate.replace('--DYNAMIC FILTERS HERE--', where);

	const queryResult = await labDb.queryFromString<AlertsRidesItem>(sql, params);

	//
	// Parse and return the result

	if (!queryResult?.length) {
		return sendErrorApiResponse(reply, {
			error: 'No alerts rides found matching the filters',
			status_code: '404',
		});
	}

	return sendSuccessApiResponse(reply, queryResult);
}

