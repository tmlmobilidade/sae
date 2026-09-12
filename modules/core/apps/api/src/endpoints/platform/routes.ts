/* * */

import { authorizationMiddleware, FastifyService } from '@tmlmobilidade/go-clients-fastify';

import { createExtractionHandler } from './handlers/create-extraction.js';
import { getMeHandler } from './handlers/get-me.js';
import { getSidebarLogoHandler } from './handlers/get-sidebar-logo.js';
import { listExtractionsHandler } from './handlers/list-extractions.js';
import { updateMePreferencesHandler } from './handlers/update-me-preferences.js';

/* * */

const NAMESPACE = '/platform';

/* * */

const server = FastifyService.getInstance().server;

server.register(
	(instance, opts, next) => {
		//

		//
		// Me

		instance.get('/me', { preHandler: authorizationMiddleware() }, getMeHandler);

		instance.put('/update-me-preferences', { preHandler: authorizationMiddleware() }, updateMePreferencesHandler);

		//
		// Extractions

		instance.get('/extractions', { preHandler: authorizationMiddleware() }, listExtractionsHandler);

		instance.post('/extractions/create', { preHandler: authorizationMiddleware() }, createExtractionHandler);

		//
		// Sidebar & Notifications

		instance.post('/sidebar-logo', { preHandler: authorizationMiddleware() }, getSidebarLogoHandler);

		instance.get('/notifications', { preHandler: authorizationMiddleware() }, getMeHandler);

		next();
	},
	{ prefix: NAMESPACE },
);
