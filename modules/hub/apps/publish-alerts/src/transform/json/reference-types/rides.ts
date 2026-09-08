/* * */

import { getQualifiedTripId } from '@tmlmobilidade/go-hub-pckg-utils';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type Alert, type AlertReference, type Ride } from '@tmlmobilidade/go-types-operation';
import { Logger } from '@tmlmobilidade/logger';

/* * */

export async function transformReferenceTypeRidesIntoJson(alertData: Alert): Promise<AlertReference[] | undefined> {
	//

	//
	// Validate required input properties

	if (!alertData.agency_id) {
		Logger.error({ message: `[Alert ID: ${alertData._id}] Alert agency_id is missing for "rides" reference type.` });
		return;
	}

	if (!alertData.references?.length) {
		Logger.error({ message: `[Alert ID: ${alertData._id}] Alert references are missing for "rides" reference type or are empty.` });
		return;
	}

	//
	// For each ride, add its corresponding
	// agency_id and trip_id to the resul	t

	const result: AlertReference[] = [];

	for (const reference of alertData.references) {
		//

		//
		// Find the ride document by its ID
		// and prepare the AlertReference object

		const foundRide = await labDb.queryFromString<Ride>(`
			SELECT * FROM operation.rides
			WHERE _id = '${reference.parent_id}'
			ORDER BY updated_at DESC
			LIMIT 1 BY _id
		`);

		if (!foundRide.length) {
			Logger.error({ message: `[Alert ID: ${alertData._id}] No ride found for ride ID ${reference.parent_id}.` });
			continue;
		}

		const parsedAlertReference: AlertReference = {
			child_ids: [],
			parent_id: getQualifiedTripId(foundRide[0].plan_id, alertData.agency_id, foundRide[0].trip_id),
		};

		result.push(parsedAlertReference);

		//
	}

	//
	// Return the compiled list
	// of AlertReference objects

	return result;

	//
}
