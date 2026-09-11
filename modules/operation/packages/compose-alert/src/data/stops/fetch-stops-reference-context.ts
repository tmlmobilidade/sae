/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type AlertsComposeRequest } from '@tmlmobilidade/go-operation-pckg-types';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';

import { type FetchStopsReferenceContextItem } from './fetch-stops-reference-context-item.js';

/**
 * Extracts the stops public names from the request.
 * @param request The request data.
 * @returns The stops public names.
 */
export async function fetchStopsReferenceContext(request: AlertsComposeRequest): Promise<string[]> {
	//

	//
	// Build the query parameters from the request data

	const params: Record<string, number | string | string[]> = {
		active_period_end_date: request.active_period_end_date,
		active_period_start_date: request.active_period_start_date,
		agency_id: request.agency_id,
		stop_ids: request.references.map(reference => reference.parent_id),
	};

	//
	// Execute the query and return the stops public names

	const queryResult = await labDb.queryFromFile<FetchStopsReferenceContextItem>(sqlPath('operation', 'compose-alert/fetch-stops-reference-context.sql'), params);

	if (!queryResult?.length) throw new Error(`No stops found for the request.`);

	return queryResult.map(item => `Stop Name: ${item.stop_name}`);
}
