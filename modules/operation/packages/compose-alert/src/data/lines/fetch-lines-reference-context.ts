/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type AlertsComposeRequest } from '@tmlmobilidade/go-operation-pckg-types';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';

import { type FetchLinesReferenceContextItem } from './fetch-lines-reference-context-item.js';

/**
 * Extracts the lines public names from the request.
 * @param request The request data.
 * @returns The lines public names.
 */
export async function fetchLinesReferenceContext(request: AlertsComposeRequest): Promise<string[]> {
	//

	//
	// Build the query parameters from the request data

	const params: Record<string, number | string | string[]> = {
		active_period_end_date: request.active_period_end_date,
		active_period_start_date: request.active_period_start_date,
		agency_id: request.agency_id,
		route_short_names: request.references.map(reference => reference.parent_id),
	};

	//
	// Execute the query and return the lines public names

	const queryResult = await labDb.queryFromFile<FetchLinesReferenceContextItem>(sqlPath('operation', 'compose-alert/fetch-lines-reference-context.sql'), params);

	if (!queryResult?.length) throw new Error(`No lines found for the request.`);

	return queryResult.map(item => `Line Short Name: ${item.route_short_name} - Line Long Name: ${item.route_long_name}`);
}
