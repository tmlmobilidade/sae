/* * */

import { runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';

import { AppConfig } from './config.js';
import { main } from './main.js';

/* * */
//
// Initialize Sentry

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'loader', message: 'Sentry ETA Loader initialized', module: 'eta', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry ETA Loader' });
}

await runOnInterval(() => main(AppConfig), { intervalMs: AppConfig.syncInterval });
