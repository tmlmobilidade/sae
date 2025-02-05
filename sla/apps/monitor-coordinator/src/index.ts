/* * */

import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { rides } from '@tmlmobilidade/core/interfaces';
import { getOperationalDate } from '@tmlmobilidade/core/utils';
import { CHUNK_LOG_DATE_FORMAT } from '@tmlmobilidade/sae-sla-pckg-constants';
import Fastify from 'fastify';
import { DateTime } from 'luxon';

/* * */

(async function init() {
	//

	//
	// Setup variables

	const fastify = Fastify({ logger: false });

	const ridesCollection = await rides.getCollection();

	let isBusy = false;

	//
	// Setup the API service

	fastify.get('/', async () => {
		//

		//
		// The whole point of a coordinator is to prevent multiple instances
		// from processing the same documents at the same time. For that reason,
		// we need to make sure that instances request the next batch of documents
		// sequentially. To do that, we implement a simple lock mechanism.

		while (isBusy) {
			LOGGER.info('Waiting for another request to complete...');
			await new Promise(resolve => setTimeout(resolve, 500));
		}

		//
		// Set the busy flag to prevent other requests
		// from being processed until the current one is done.

		isBusy = true;

		//
		// Find all ride IDs that are pending analysis and which started before the current time,
		// sorted in descending order to prioritize the most recent rides.

		const batchSize = 1000;
		const currentTime = DateTime.now().setZone('Europe/Lisbon');

		const fetchTimer = new TIMETRACKER();

		// const latestPendingRides = await ridesCollection
		// 	.aggregate([
		// 		{ $match: { start_time_scheduled: { $lte: currentTime.toJSDate() }, system_status: 'pending' } },
		// 		{ $sort: { start_time_scheduled: -1, trip_id: -1 } },
		// 		{ $limit: batchSize },
		// 	])
		// 	.toArray();

		const latestPendingRides = await ridesCollection
			.find({ operational_date: { $lte: getOperationalDate() }, system_status: 'pending' })
			.sort({ start_time_scheduled: -1 })
			.limit(batchSize)
			.toArray();

		const latestPendingRidesIds = latestPendingRides.map(ride => ride._id);

		const fetchTimerResult = fetchTimer.get();

		if (latestPendingRidesIds.length === 0) {
			LOGGER.info(`No rides to process | start_time_scheduled: ${currentTime.toFormat(CHUNK_LOG_DATE_FORMAT)} (fetch: ${fetchTimerResult})`);
			isBusy = false;
			return [];
		}

		//
		// Mark those rides as 'processing' to ensure the next batch of rides does not include them,
		// and return them to the caller instance.

		const markTimer = new TIMETRACKER();

		await ridesCollection.updateMany({ _id: { $in: latestPendingRidesIds } }, { $set: { system_status: 'processing' } });

		LOGGER.info(`New batch: Qty ${latestPendingRidesIds.length} | start_time_scheduled: ${currentTime.toFormat(CHUNK_LOG_DATE_FORMAT)} (fetch: ${fetchTimerResult} | total: ${markTimer.get()})`);

		isBusy = false;

		return latestPendingRidesIds;

		//
	});

	//
	// Start the API service

	fastify.listen({ host: '::0', port: 5050 }, (err, address) => {
		if (err) {
			console.log(err);
			process.exit(1);
		}
		LOGGER.info(`Server listening at ${address}`);
	});

	//
})();
