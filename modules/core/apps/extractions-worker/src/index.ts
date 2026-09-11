/* * */

import { runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/* * */

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'cleaner', message: 'Sentry Auth Cleaner initialized', module: 'core', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Auth Cleaner' });
}

/* * */

async function main() {
	//

	Logger.init();

	const globalTimer = new Timer();

	await cleanExpiredSessions();
	await cleanExpiredVerificationTokens();
	await sanitizePermissions();

	Logger.terminate(`Cleanup completed in ${globalTimer.get()}`);
}

/* * */

await runOnInterval(main, { intervalMs: '5m' });
