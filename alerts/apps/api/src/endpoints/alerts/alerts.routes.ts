/* * */

import authorizationMiddleware from '@/middleware/authorization.middleware';
import FastifyService from '@/services/fastify.service';
import { Permissions } from '@tmlmobilidade/core/lib';
import { Alert } from '@tmlmobilidade/core/types';
import { FastifyInstance } from 'fastify';

import { AlertsController } from './alerts.controller';

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
					Permissions.alerts.actions.list,
				),
			},
			AlertsController.getAll,
		);

		// GET /alerts/:id
		instance.get(
			'/:id',
			{
				preHandler: authorizationMiddleware<Alert>(
					Permissions.alerts.scope,
					Permissions.alerts.actions.read,
				),
			},
			AlertsController.getById,
		);

		// GET /alerts/:id/image
		instance.get(
			'/:id/image',
			{
				preHandler: authorizationMiddleware<Alert>(
					Permissions.alerts.scope,
					Permissions.alerts.actions.read,
				),
			},
			AlertsController.getImage,
		);

		// POST /alerts
		instance.post(
			'/',
			{
				preHandler: authorizationMiddleware<Alert>(
					Permissions.alerts.scope,
					Permissions.alerts.actions.create,
				),
			},
			AlertsController.create,
		);

		// PUT /alerts/:id
		instance.put(
			'/:id',
			{
				preHandler: authorizationMiddleware<Alert>(
					Permissions.alerts.scope,
					Permissions.alerts.actions.update,
				),
			},
			AlertsController.update,
		);

		// DELETE /alerts/:id
		instance.delete(
			'/:id',
			{
				preHandler: authorizationMiddleware<Alert>(
					Permissions.alerts.scope,
					Permissions.alerts.actions.delete,
				),
			},
			AlertsController.delete,
		);

		// POST /alerts/:id/image
		instance.post(
			'/:id/image',
			{
				preHandler: authorizationMiddleware<Alert>(
					Permissions.alerts.scope,
					Permissions.alerts.actions.update,
				),
			},
			AlertsController.uploadImage,
		);

		// DELETE /alerts/:id/image
		instance.delete(
			'/:id/image',
			{
				preHandler: authorizationMiddleware<Alert>(
					Permissions.alerts.scope,
					Permissions.alerts.actions.update,
				),
			},
			AlertsController.deleteImage,
		);

		next();
	},
	{ prefix: namespace },
);
