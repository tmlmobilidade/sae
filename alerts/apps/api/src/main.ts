/* * */

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { FastifyServerOptions } from 'fastify';

import FastifyService from './services/fastify.service';

/* * */

const options: FastifyServerOptions = {
	ignoreTrailingSlash: true,
	logger: {
		level: 'debug',
		transport: {
			options: {
				colorize: true,
			},
			target: 'pino-pretty',
		},
	},
};

async function main() {
	// Start Fastify server
	const fastifyService = FastifyService.getInstance(options);
	await fastifyService.server.register(fastifyMultipart, {
		limits: {
			fileSize: 1024 * 1024 * 10, // 10MB
		},
	});
	await fastifyService.server.register(cookie);

	// Setup CORS
	const origin
		= process.env.NODE_ENV === 'development'
			? true
			: `https://*.${process.env.COOKIE_DOMAIN}`;

	await fastifyService.server.register(cors, {
		credentials: true,
		origin,
	});

	await fastifyService.start();
}

main();
