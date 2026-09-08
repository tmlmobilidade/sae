/* * */

import { getQualifiedRouteId } from '@tmlmobilidade/go-hub-pckg-utils';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type GtfsRtEntitySelector } from '@tmlmobilidade/go-types-gtfs-rt';
import { type Alert } from '@tmlmobilidade/go-types-operation';
import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { Logger } from '@tmlmobilidade/logger';

/* * */

export async function transformReferenceTypeLinesIntoGtfsRt(alertData: Alert): Promise<GtfsRtEntitySelector[] | undefined> {
	//

	//
	// Validate required input properties

	if (!alertData.agency_id || !alertData.references?.length) {
		Logger.error({ message: `[Alert ID: ${alertData._id}] Alert references are missing for "lines" reference type.` });
		return;
	}

	if (!alertData.active_period_start_date) {
		Logger.error({ message: `[Alert ID: ${alertData._id}] Alert active_period_start_date is missing.` });
		return;
	}

	//
	// For each line, add its corresponding
	// agency_id and route_id to the result

	const result: GtfsRtEntitySelector[] = [];

	for (const reference of alertData.references) {
		//

		//
		// Set a default end date to one hour after the current time
		// to limit the search for rides if active_period_end_date is not provided.

		let activePeriodEndDate: UnixMilliseconds;

		if (!alertData.active_period_end_date) activePeriodEndDate = Dates.now('Europe/Lisbon').plus({ hours: 1 }).unix_milliseconds;
		else activePeriodEndDate = alertData.active_period_end_date;

		//
		// Find distinct values of route_id
		// for rides matching the line ID,
		// the agency ID, and the alert start time.

		const foundRouteIds = await labDb.queryFromString<{ route_id: string }>(
			`
				SELECT DISTINCT route_id
				FROM operation.rides
				WHERE agency_id = $1
				AND route_short_name = $2
				AND start_time_scheduled >= $3
				AND start_time_scheduled <= $4;
			`,
			{
				1: alertData.agency_id,
				2: reference.parent_id,
				3: alertData.active_period_start_date,
				4: activePeriodEndDate,
			},
		);

		if (!foundRouteIds?.length) {
			Logger.error({ message: `[Alert ID: ${alertData._id}] No rides found for line ID ${reference.parent_id} and start time ${alertData.active_period_start_date}.` });
			continue;
		}

		const uniqueRouteIds = Array.from(new Set(foundRouteIds.map(item => item.route_id)));

		//
		// Generate an EntitySelector
		// for each distinct route_id found.

		for (const routeId of uniqueRouteIds) {
			//

			const parsedEntitySelector: GtfsRtEntitySelector = {
				agency_id: alertData.agency_id,
				route_id: getQualifiedRouteId(alertData.agency_id, routeId),
			};

			if (!reference.child_ids?.length) {
				result.push(parsedEntitySelector);
				continue;
			}

			//
			// If there are child_ids, which in this context
			// represent stop IDs associated with the line,
			// add an EntitySelector object for each stop ID.

			for (const childId of reference.child_ids) {
				const foundStopData = await goDb.infrastructure.stops.findOne({
					'flags.agency_ids': { $in: [alertData.agency_id] },
					'flags.stop_id': childId,
				});
				if (!foundStopData) {
					Logger.error({ message: `[Alert ID: ${alertData._id}] Stop ID ${childId} not found for agency ID ${alertData.agency_id}.` });
					continue;
				}
				result.push({
					...parsedEntitySelector,
					stop_id: foundStopData._id,
				});
			}

			//
		}

		//
	}

	//
	// Return the compiled list
	// of EntitySelector objects

	return result;

	//
}
