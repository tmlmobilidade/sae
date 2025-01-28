'use strict';

/* * */

import fastifyWs from '@fastify/websocket';
import fastifyModule from 'fastify';

const FastifyInstance = fastifyModule();

FastifyInstance.register(fastifyWs);

FastifyInstance.register(async function (fastify) {
	fastify.get('/', { websocket: true }, (socket /* WebSocket */, req /* FastifyRequest */) => {
		socket.on('message', (message) => {
			// message.toString() === 'hi from client'
			socket.send('hi from server');
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
