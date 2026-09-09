/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { performInTimeChunks, runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { syncRides } from './tasks/sync-rides.js';

/* * */

//
// Initialize Sentry

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'rides-sync', message: 'Sentry Rides Sync initialized', module: 'operation', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Rides Sync' });
}

async function main() {
	//

	try {
		//

		Logger.init();

		const globalTimer = new Timer();

		//
		// Get the earliest date from which we have data to sync,
		// and perform the sync in time chunks until we reach the current date.

		const earliestRide = await goDb.operation.rides.findOne({}, {
			projection: { _id: 1, start_time_scheduled: 1 },
			sort: { start_time_scheduled: 1 },
		});

		const latestRide = await goDb.operation.rides.findOne({}, {
			projection: { _id: 1, start_time_scheduled: 1 },
			sort: { start_time_scheduled: -1 },
		});

		Logger.title(`Running sync from ${Dates.fromUnixMilliseconds(earliestRide.start_time_scheduled).toLocaleString('full', 'UTC')} to ${Dates.fromUnixMilliseconds(latestRide.start_time_scheduled).toLocaleString('full', 'UTC')}`);

		//
		// Divide the time range into chunks
		// and sync each one sequentially.

		await performInTimeChunks({
			endDate: latestRide.start_time_scheduled,
			intervalHrs: 12,
			onChunk: async (chunk) => {
				try {
					await syncRides(chunk);
				} catch (error) {
					// Verify if the error is related to
					// the distinct query being too big
					const keywords = ['distinct', 'too', 'big'];
					if (!keywords.some(keyword => error.message?.toLowerCase().includes(keyword))) throw error;
					Logger.info({ message: `Distinct query too big — splitting chunk into smaller chunks... (${error.message})` });
					// If it is, we need to repeat the process by splitting
					// the current chunk into smaller chunks
					await performInTimeChunks({
						endDate: chunk.end,
						intervalHrs: 6,
						onChunk: async chunk => await syncRides(chunk),
						order: 'desc',
						startDate: chunk.start,
					});
				}
			},
			order: 'desc',
			startDate: earliestRide.start_time_scheduled,
		});

		Logger.terminate(`Run took ${globalTimer.get()}.`);

		//
	} catch (err) {
		console.log('An error occurred. Halting execution.', err);
	}
}

/* * */

await runOnInterval(main, { intervalMs: '1m' });
