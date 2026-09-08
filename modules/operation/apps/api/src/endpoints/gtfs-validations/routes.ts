/* * */

import { authorizationMiddleware, FastifyService } from '@tmlmobilidade/go-clients-fastify';

import { approveGtfsValidationHandler } from './handlers/approve-gtfs-validation.js';
import { createGtfsValidationHandler } from './handlers/create-gtfs-validation.js';
import { downloadGtfsValidationFileHandler } from './handlers/download-gtfs-validation-file.js';
import { getGtfsValidationFileHandler } from './handlers/get-gtfs-validation-file.js';
import { getGtfsValidationHandler } from './handlers/get-gtfs-validation.js';
import { listAgenciesHandler } from './handlers/list-agencies.js';
import { listGtfsValidationsHandler } from './handlers/list-gtfs-validations.js';
import { lockGtfsValidationHandler } from './handlers/lock-gtfs-validation.js';
import { requestApprovalHandler } from './handlers/request-approval.js';
import { updateProcessingStatusHandler } from './handlers/update-processing-status.js';

/* * */

const NAMESPACE = '/gtfs-validations';

/* * */

const server = FastifyService.getInstance().server;

server.register(
	(instance, opts, next) => {
		//

		instance.post('/list', { preHandler: authorizationMiddleware('gtfs_validations', ['read']) }, listGtfsValidationsHandler);

		instance.post('/list-agencies', { preHandler: authorizationMiddleware('gtfs_validations', ['read']) }, listAgenciesHandler);

		instance.get('/:id', { preHandler: authorizationMiddleware('gtfs_validations', ['read']) }, getGtfsValidationHandler);

		instance.post('/create', { preHandler: authorizationMiddleware('gtfs_validations', ['create']) }, createGtfsValidationHandler);

		instance.get('/:id/file', { preHandler: authorizationMiddleware('gtfs_validations', ['read']) }, getGtfsValidationFileHandler);

		instance.get('/:id/file/download', { preHandler: authorizationMiddleware('gtfs_validations', ['read']) }, downloadGtfsValidationFileHandler);

		instance.get('/:id/request-approval', { preHandler: authorizationMiddleware('gtfs_validations', ['request_approval']) }, requestApprovalHandler);

		instance.post('/:id/approve', { preHandler: authorizationMiddleware('plans', ['create']) }, approveGtfsValidationHandler);

		instance.get('/:id/lock', { preHandler: authorizationMiddleware('gtfs_validations', ['lock']) }, lockGtfsValidationHandler);

		instance.put('/:id/processing-status', { preHandler: authorizationMiddleware('gtfs_validations', ['update_processing_status']) }, updateProcessingStatusHandler);

		next();
	},
	{ prefix: NAMESPACE },
);
