/* * */

import { getQualifiedRouteId, getQualifiedTripId } from '@tmlmobilidade/go-hub-pckg-utils';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type GtfsRtEntitySelector } from '@tmlmobilidade/go-types-gtfs-rt';
import { type Alert, type Ride } from '@tmlmobilidade/go-types-operation';
import { Logger } from '@tmlmobilidade/logger';

/* * */

export async function transformReferenceTypeRidesIntoGtfsRt(alertData: Alert): Promise<GtfsRtEntitySelector[] | undefined> {
	//

	//
	// Validate required input properties

	if (!alertData.agency_id || !alertData.references?.length) {
		Logger.error({ message: `[Alert ID: ${alertData._id}] Alert references are missing for "rides" reference type.` });
		return;
	}

	if (!alertData.active_period_start_date) {
		Logger.error({ message: `[Alert ID: ${alertData._id}] Alert active_period_start_date is missing.` });
		return;
	}

	if (!alertData.active_period_end_date) {
		Logger.error({ message: `[Alert ID: ${alertData._id}] Alert active_period_end_date is missing.` });
		return;
	}

	//
	// For each ride, add its corresponding
	// agency_id and route_id to the result

	const result: GtfsRtEntitySelector[] = [];

	for (const reference of alertData.references) {
		//

		//
		// Find distinct values of route_id
		// for rides matching the ride ID,
		// the agency ID, and the alert start time.

		const foundRide = await labDb.queryFromString<Ride>(`
			SELECT * FROM operation.rides
			WHERE _id = '${reference.parent_id}'
			ORDER BY updated_at DESC
			LIMIT 1 BY _id
		`);

		if (!foundRide?.length) {
			Logger.error({ message: `[Alert ID: ${alertData._id}] No ride found for ride ID ${reference.parent_id}.` });
			continue;
		}

		const parsedEntitySelector: GtfsRtEntitySelector = {
			agency_id: alertData.agency_id,
			trip: {
				route_id: getQualifiedRouteId(alertData.agency_id, foundRide[0].route_id),
				schedule_relationship: 'SCHEDULED',
				start_date: foundRide[0].operational_date,
				trip_id: getQualifiedTripId(foundRide[0].plan_id, alertData.agency_id, foundRide[0].trip_id),
			},
		};

		result.push(parsedEntitySelector);

		//
	}

	//
	// Return the compiled list
	// of GtfsRtEntitySelector objects

	return result;

	//
}
