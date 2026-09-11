/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { exportPlanPostersFile } from './export-plan-posters.js';
import { claimPosterExport } from './processing.js';

/* * */

async function processWaitingExports(): Promise<void> {
	Logger.init();

	const globalTimer = new Timer();
	const waitingExports = await goDb.core.exports.findMany({
		processing_status: 'waiting',
		type: 'plan_posters',
	});

	Logger.info({ message: `Found ${waitingExports.length} waiting plan poster exports.` });

	for (const fileExport of waitingExports) {
		const claim = await claimPosterExport(fileExport._id);
		if (!claim) continue;
		try {
			Logger.info({ message: `Processing plan poster export ${fileExport._id} for Plan ${(fileExport.properties as { plan_id?: string }).plan_id ?? 'unknown'}.` });
			const downloadUrl = await exportPlanPostersFile(fileExport);
			await claim.complete(downloadUrl);

			Logger.success(`Plan poster export ${fileExport._id} completed and download link saved.`);
		} catch (error) {
			Logger.error({ error, message: `Error processing plan poster export ${fileExport._id}.` });
			await claim.fail();
		}
	}

	//
	// Log the completion of the run.

	Logger.terminate(`completed in ${globalTimer.get()}s`);
}

/* * */

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'export-posters', message: 'Sentry Plans Export Posters initialized', module: 'plans', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Plans Export Posters' });
}

Logger.info({ message: `Poster worker ${process.pid} started; checking for abandoned exports.` });

await runOnInterval(processWaitingExports, { intervalMs: '5s' });
