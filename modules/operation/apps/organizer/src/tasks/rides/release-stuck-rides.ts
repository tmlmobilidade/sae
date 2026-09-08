/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/**
 * Release stuck rides that have been processing for more than 3 minutes.
 */
export async function releaseStuckRidesTask() {
	//

	Logger.init();

	const globalTimer = new Timer();

	//
	// Update all processing rides where updated_at
	// is more than 3 minutes ago to 'waiting'.

	const ridesCollection = await goDb.operation.rides.getCollection();

	const updateResult = await ridesCollection.updateMany(
		{
			processing_status: 'processing',
			updated_at: { $lt: Dates.now('utc').minus({ minutes: 3 }).unix_milliseconds },
		},
		{
			$set: { processing_status: 'waiting' },
		},
	);

	Logger.terminate(`Released ${updateResult.modifiedCount} stuck rides in ${globalTimer.get()}.`);
};
