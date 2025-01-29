'use strict';

/* * */

import fastifyWs from '@fastify/websocket';
import fastifyModule from 'fastify';

import { watchDb } from './watchDb.js';

const FastifyInstance = fastifyModule();

FastifyInstance.register(fastifyWs);

FastifyInstance.register(async function (fastify) {
	fastify.get('/', { websocket: true }, (socket /* WebSocket */, req /* FastifyRequest */) => {
		socket.on('message', (message) => {
			console.log('Message from client ', message);
			watchDb(socket);
			socket.send('hi from server');
			socket.send('hi from server again');
		});
	});
});

FastifyInstance.listen({ host: process.env.FASTIFY_HOST || '0.0.0.0', port: Number(process.env.FASTIFY_PORT) || 5050 }, (err) => {
	console.log('hey!');
	if (err) {
		FastifyInstance.log.error(err);
		process.exit(1);
	}
});
