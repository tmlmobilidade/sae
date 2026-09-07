/* * */

import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import Fastify from 'fastify';

import { getPlans } from './handlers/get-plans.js';
import { getRideMatches } from './handlers/get-ride-matches.js';
import { getRides } from './handlers/get-rides.js';

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

	fastify.get('/rides', getRides);

	fastify.get('/ride-matches', getRideMatches);

	fastify.get('/plans', getPlans);

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
