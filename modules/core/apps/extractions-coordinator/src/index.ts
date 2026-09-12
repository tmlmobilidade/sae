/* * */

import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import Fastify from 'fastify';

import { getExtractionsHandler } from './handlers/get-extractions.js';

/* * */

//
// Initialize Sentry

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'extractions-coordinator', message: 'Sentry Extractions Coordinator initialized', module: 'core', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Extractions Coordinator' });
}

await (async function init() {
	//

	//
	// Setup variables

	const fastify = Fastify({ logger: false });

	//
	// Setup the API services

	fastify.get('/extractions', getExtractionsHandler);

	//
	// Start the API service

	fastify.listen({ host: '::0', port: 5050 }, (err, address) => {
		if (err) {
			console.log(err);
			process.exit(1);
		}
		Logger.info({ message: `Server listening at ${address}` });
	});

	//
})();
