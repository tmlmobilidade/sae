/* * */

import { FastifyInstance } from 'fastify';
import FastifyService from '@/services/fastify.service';
import { AlertsController } from './alerts.controller';
import authorizationMiddleware from '@/middleware/authorization.middleware';
import { Permissions } from '@tmlmobilidade/services/lib';
import { Alert } from '@tmlmobilidade/services/types';

/* * */

const server: FastifyInstance = FastifyService.getInstance().server;
const namespace = '/alerts';

/* * */

server.register(
	(instance, opts, next) => {
		// GET /alerts
		instance.get(
			'/',
			{
				preHandler: authorizationMiddleware<Alert>(
					Permissions.alerts.scope,
					Permissions.alerts.actions.list
				),
			},
			AlertsController.getAll
		);

		// GET /alerts/:id
		instance.get(
			'/:id',
			{
				preHandler: authorizationMiddleware<Alert>(
					Permissions.alerts.scope,
					Permissions.alerts.actions.read
				),
			},
			AlertsController.getById
		);

		// POST /alerts
		instance.post(
			'/',
			{
				preHandler: authorizationMiddleware<Alert>(
					Permissions.alerts.scope,
					Permissions.alerts.actions.create
				),
			},
			AlertsController.create
		);

		// PUT /alerts/:id
		instance.put(
			'/:id',
			{
				preHandler: authorizationMiddleware<Alert>(
					Permissions.alerts.scope,
					Permissions.alerts.actions.update
				),
			},
			AlertsController.update
		);

		// DELETE /alerts/:id
		instance.delete(
			'/:id',
			{
				preHandler: authorizationMiddleware<Alert>(
					Permissions.alerts.scope,
					Permissions.alerts.actions.delete
				),
			},
			AlertsController.delete
		);

		next();
	},
	{ prefix: namespace }
);
