/* * */

import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { rides } from '@tmlmobilidade/core/interfaces';

/* * */

export async function reprocessStuckRides() {
	try {
		//

		LOGGER.init();

		const globalTimer = new TIMETRACKER();

		//
		// Get all 'processing' rides from the database

		const fetchStuckTimerA = new TIMETRACKER();

		const stuckRidesA = await rides.findMany({ system_status: { $in: ['processing'] } });
		const stuckRideIdsA = stuckRidesA.map(item => item._id);

		const fetchStuckTimerResultA = fetchStuckTimerA.get();

		//
		// A Ride can be in the processing state for at most 1 second. If it takes longer than that,
		// then something happended (like a restart of the monitor worker responsible for that ride)
		// and the ride is considered stuck. The should be marked as 'pending' to be reprocessed.

		await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again

		const fetchStuckTimerB = new TIMETRACKER();

		const stuckRidesB = await rides.findMany({ system_status: { $in: ['processing'] } });
		const stuckRideIdsB = stuckRidesB.map(item => item._id);

		const fetchStuckTimerResultB = fetchStuckTimerB.get();

		// Now, we have two lists of stuck rides. We need to find the rides that are in both lists
		// to avoid reprocessing rides that were already reprocessed.

		const markingTimer = new TIMETRACKER();

		const stuckRideIds = stuckRideIdsA.filter(item => stuckRideIdsB.includes(item));

		const ridesCollection = await rides.getCollection();
		await ridesCollection.updateMany({ _id: { $in: stuckRideIds } }, { system_status: 'pending' });

		const markingTimerResult = markingTimer.get();

		//

		LOGGER.info(`Found ${stuckRideIds.length} stuck rides that were marked as 'pending'. (fetch A: ${fetchStuckTimerResultA} | fetch B: ${fetchStuckTimerResultB} | marking: ${markingTimerResult})`);
		LOGGER.spacer(1);

		//

		LOGGER.terminate(`Run took ${globalTimer.get()}.`);

		//
	}
	catch (err) {
		LOGGER.error('An error occurred. Halting execution.', err);
		LOGGER.error('Retrying in 10 seconds...');
		setTimeout(() => {
			process.exit(0); // End process
		}, 10000); // after 10 seconds
	}

	//
};
