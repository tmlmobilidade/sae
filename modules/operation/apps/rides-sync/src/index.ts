/* * */

import { syncApexBankingTaps } from '@/task.js';
import { getEarliestDate } from '@tmlmobilidade/consts';
import { performInTimeChunks, runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/* * */

async function main() {
	//
	// Initialize Sentry

	try {
		await initSentryNode();
		Logger.startNodeLogs({ app: 'raw-sync-banking-taps', message: 'Sentry APEX Raw Sync Banking Taps initialized', module: 'apex', severity: 'info' });
	} catch (error) {
		Logger.error({ error, message: 'Error initializing Sentry APEX Raw Sync Banking Taps' });
	}

	//

	try {
		//

		Logger.init();

		const globalTimer = new Timer();

		//
		// Get the earliest date from which we have data to sync,
		// and perform the sync in time chunks until we reach the current date.

		const earliestDate = getEarliestDate();

		//
		// Divide the time range into chunks
		// and sync each one sequentially.

		await performInTimeChunks({
			intervalHrs: 2,
			onChunk: async (chunk) => {
				try {
					await syncApexBankingTaps(chunk);
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
						intervalHrs: 5 / 60, // 5 minutes
						onChunk: async chunk => await syncApexBankingTaps(chunk),
						order: 'desc',
						startDate: chunk.start,
					});
				}
			},
			order: 'desc',
			startDate: earliestDate.unix_milliseconds,
		});

		Logger.terminate(`Run took ${globalTimer.get()}.`);

		//
	} catch (err) {
		console.log('An error occurred. Halting execution.', err);
	}
}

/* * */

await runOnInterval(main, { intervalMs: '30m' });
