/* * */

import { fastifyWebsocket } from '@fastify/websocket';
import { authorizationMiddleware, type FastifyInstance, FastifyService } from '@tmlmobilidade/go-clients-fastify';

import { getSimplifiedApexBankingTapsHandler } from './handlers/get-apex-banking-taps.js';
import { getSimplifiedApexLocationsHandler } from './handlers/get-apex-locations.js';
import { getSimplifiedApexOnBoardRefundsHandler } from './handlers/get-apex-refunds.js';
import { getSimplifiedApexOnBoardSalesHandler } from './handlers/get-apex-sales.js';
import { getSimplifiedApexValidationsHandler } from './handlers/get-apex-validations.js';
import { getHashedShapeHandler } from './handlers/get-hashed-shape.js';
import { getHashedTripHandler } from './handlers/get-hashed-trip.js';
import { getRideAnalysesHandler } from './handlers/get-ride-analyses.js';
import { getRideHandler } from './handlers/get-ride.js';
import { getSimplifiedVehicleEventsHandler } from './handlers/get-vehicle-events.js';
import { listAgenciesHandler } from './handlers/list-agencies.js';
import { listRidesHandler } from './handlers/list-rides.js';
import { updateProcessingStatusHandler } from './handlers/update-processing-status.js';

/* * */

const server: FastifyInstance = FastifyService.getInstance().server;

/* * */

const NAMESPACE = '/rides';

server.register(
	async (instance) => {
		//

		await instance.register(fastifyWebsocket);

		instance.post('/list', { preHandler: authorizationMiddleware('rides', ['analysis_read']) }, listRidesHandler);

		instance.get('/list-agencies', { preHandler: authorizationMiddleware('rides', ['analysis_read']) }, listAgenciesHandler);

		instance.get('/:id/ride', { preHandler: authorizationMiddleware('rides', ['analysis_read']) }, getRideHandler);

		instance.get('/:id/hashed-shape', { preHandler: authorizationMiddleware('rides', ['analysis_read']) }, getHashedShapeHandler);

		instance.get('/:id/hashed-trip', { preHandler: authorizationMiddleware('rides', ['analysis_read']) }, getHashedTripHandler);

		instance.get('/:id/analyses', { preHandler: authorizationMiddleware('rides', ['analysis_read']) }, getRideAnalysesHandler);

		instance.get('/:id/vehicle-events', { preHandler: authorizationMiddleware('rides', ['analysis_read']) }, getSimplifiedVehicleEventsHandler);

		instance.get('/:id/apex-banking-taps', { preHandler: authorizationMiddleware('rides', ['analysis_read']) }, getSimplifiedApexBankingTapsHandler);

		instance.get('/:id/apex-locations', { preHandler: authorizationMiddleware('rides', ['analysis_read']) }, getSimplifiedApexLocationsHandler);

		instance.get('/:id/apex-validations', { preHandler: authorizationMiddleware('rides', ['analysis_read']) }, getSimplifiedApexValidationsHandler);

		instance.get('/:id/apex-sales', { preHandler: authorizationMiddleware('rides', ['analysis_read']) }, getSimplifiedApexOnBoardSalesHandler);

		instance.get('/:id/apex-refunds', { preHandler: authorizationMiddleware('rides', ['analysis_read']) }, getSimplifiedApexOnBoardRefundsHandler);

		instance.patch('/:id/processing-status', { preHandler: authorizationMiddleware('rides', ['analysis_reprocess']) }, updateProcessingStatusHandler);

		// instance.get('/favorites', { preHandler: authorizationMiddleware('rides', ['analysis_read']) }, (request: FastifyRequest<{ Querystring: { ids: string } }>, reply: FastifyReply<RideNormalized[]>) => RidesSharedController.getRideByIds(request, reply, 'rides', 'analysis_read'));

		//
	},
	{ prefix: NAMESPACE },
);
