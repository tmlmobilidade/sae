/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type SimplifiedApexBankingTap, type SimplifiedApexLocation, type SimplifiedApexOnBoardRefund, type SimplifiedApexOnBoardSale, type SimplifiedApexValidation } from '@tmlmobilidade/go-types-apex';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/**
 * Common type for all SimplifiedApex documents that can be processed by the setRidesAsWaiting callback.
 * This type is a union of all the different SimplifiedApex document types that we expect to receive,
 * allowing the setRidesAsWaiting function to handle them in a generic way.
 * Do not use this type outside of the setRidesAsWaiting callback.
 */
type AnySimplifiedApexDocument =
  | SimplifiedApexBankingTap
  | SimplifiedApexLocation
  | SimplifiedApexOnBoardRefund
  | SimplifiedApexOnBoardSale
  | SimplifiedApexValidation;

/**
 * Callback function to set Rides as 'waiting' based on new SimplifiedApex data.
 * This function identifies all Rides that are affected by the new data and marks them as 'waiting',
 * which will trigger the necessary reprocessing in the system.
 * @param data An array of SimplifiedApex documents that have been inserted or updated.
 */
export async function setRidesAsWaiting(data: AnySimplifiedApexDocument[]) {
	try {
		//

		const timer = new Timer();

		//
		// Skip if there's no data to process

		if (!data || data.length === 0) return;

		//
		// Build out the query to find all Rides
		// that are affected by the new data.

		const updateRidesOps = data
			// Filter out documents that don't have a trip_id,
			// as they can't be associated with a Ride.
			.filter(item => item.trip_id)
			// Map each document to a query that will match
			// Rides that are affected by the new data.
			.map((item: AnySimplifiedApexDocument) => {
				const standardWindowInterval = Dates
					.fromUnixMilliseconds(item.created_at)
					.std_window;
				return {
					agency_id: item.agency_id,
					start_time_scheduled: {
						$gte: standardWindowInterval.start,
						$lte: standardWindowInterval.end,
					},
					trip_id: item.trip_id ?? undefined,
				};
			});

		//
		// Skip if there are no valid queries to run

		if (!updateRidesOps.length) return;

		//
		// Run the update query to mark all affected Rides as 'waiting',
		// which will trigger the necessary reprocessing in the system.

		const ridesCollection = await goDb.operation.rides.getCollection();

		const updateRidesResult = await ridesCollection.updateMany(
			{ $or: updateRidesOps },
			{ $set: { processing_status: 'waiting' } },
		);

		Logger.info({ message: `Marked as 'waiting': ${updateRidesResult.modifiedCount} Rides (${timer.get()})` });

		//
	} catch (error) {
		Logger.error({ error, message: `Error in setRidesAsWaiting: ${error?.message ?? 'Unknown error'}` });
	}
};
