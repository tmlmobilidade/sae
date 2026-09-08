/* * */

import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import Fastify from 'fastify';

import { getPlansHandler } from './handlers/get-plans.js';
import { getRidesHandler } from './handlers/get-rides.js';

/* * */

//
// Initialize Sentry

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'coordinator', message: 'Sentry Coordinator initialized', module: 'controller', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Coordinator' });
}

await (async function init() {
	//

	//
	// Setup variables

	const fastify = Fastify({ logger: false });

	//
	// Setup the API services

	fastify.get('/rides', getRidesHandler);

	fastify.get('/plans', getPlansHandler);

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
