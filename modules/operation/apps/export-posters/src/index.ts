/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { ProcessingStatusSchema } from '@tmlmobilidade/go-types-shared';
import { runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { exportPlanPostersFile } from './export-plan-posters.js';

/* * */

async function processWaitingExports(): Promise<void> {
	const globalTimer = new Timer();
	const waitingExports = await goDb.core.exports.findMany({
		processing_status: ProcessingStatusSchema.enum.waiting,
		type: 'plan_posters',
	});

	Logger.info({ message: `Found ${waitingExports.length} waiting plan poster exports.` });

	for (const fileExport of waitingExports) {
		try {
			Logger.info({ message: `Processing plan poster export ${fileExport._id} for Plan ${(fileExport.properties as { plan_id?: string }).plan_id ?? 'unknown'}.` });
			await goDb.core.exports.updateById(fileExport._id, { processing_status: 'processing' });

			const file = await exportPlanPostersFile(fileExport);
			await goDb.core.exports.updateById(fileExport._id, { file_id: file._id, processing_status: 'complete' });

			Logger.success(`Plan poster export ${fileExport._id} completed and attachment ${file._id} saved.`);
		} catch (error) {
			Logger.error({ error, message: `Error processing plan poster export ${fileExport._id}.` });
			await goDb.core.exports.updateById(fileExport._id, { processing_status: 'error' });
		}
	}

	Logger.info({ message: `Plan poster exporter run completed in ${globalTimer.get()}.` });
}

/* * */

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'export-posters', message: 'Sentry Plans Export Posters initialized', module: 'plans', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Plans Export Posters' });
}

Logger.init();

await runOnInterval(processWaitingExports, { intervalMs: '5s' });
