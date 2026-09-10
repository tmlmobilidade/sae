/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type AlertsComposeRequest } from '@tmlmobilidade/go-operation-pckg-types';
import { type TimezoneIdentified } from '@tmlmobilidade/go-types-shared';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';

import { type FetchRidesReferenceContextItem } from './fetch-rides-reference-context-item.js';

/**
 * Extracts the rides public names from the request.
 * @param request The request data.
 * @returns The rides public names.
 */
export async function fetchRidesReferenceContext(request: AlertsComposeRequest, timezone: TimezoneIdentified): Promise<string[]> {
	//

	//
	// Build the query parameters from the request data

	const params: Record<string, number | string | string[]> = {
		active_period_end_date: request.active_period_end_date,
		active_period_start_date: request.active_period_start_date,
		agency_id: request.agency_id,
		ride_ids: request.references.map(reference => reference.parent_id),
	};

	//
	// Execute the query and return the stops public names

	const queryResult = await labDb.queryFromFile<FetchRidesReferenceContextItem>(sqlPath('operation', 'compose-alert/fetch-rides-reference-context.sql'), params);

	if (!queryResult?.length) throw new Error(`No rides found for the request.`);

	return queryResult.map((item) => {
		const formattedDate = Dates
			.fromUnixMilliseconds(item.start_time_scheduled)
			.setZone(timezone, 'offset_only')
			.toFormat('HH:mm');
		return `Trip of the line ${item.route_short_name} headed to ${item.headsign} departing at ${formattedDate}`;
	});
}
