/* * */

import { sendInitalRidesDataset } from '@/services/send-inital-rides-dataset.js';
import { watchRides } from '@/services/watch-rides.js';
import LOGGER from '@helperkits/logger';
import { type WebSocketMessage } from '@tmlmobilidade/core/types';
import { WebSocket } from 'ws';

/**
 * Handle the 'init' connection event.
 * Start the database watch service and then send the initial dataset.
 * It is required to start the watch service before sending the initial dataset
 * to avoid missing any changes; the client will then sort the data and apply the changes.
*/
export const ridesWs = async function (fastify) {
	fastify.get('/', { websocket: true }, (socket: WebSocket) => {
		socket.on('message', async (message) => {
			//

			const messageString = message.toString();
			const messageData: WebSocketMessage = JSON.parse(messageString);

			if (messageData.module !== 'sla-explorer') {
				LOGGER.error(`[init] Received a message for an unknown module: ${messageData.module}`);
				return;
			}

			if (messageData.action === 'init') {
				//

				//
				// Start the database watch service.

				LOGGER.info('[init] Initiating watch service...');
				await watchRides(socket);
				LOGGER.info('[init] Watch service started.');

				//
				// Then, send the initial dataset.

				LOGGER.info('[init] Preparing initial dataset...');
				await sendInitalRidesDataset(socket);
				LOGGER.info('[init] Initial dataset sent.');

				//
				// Finalize the initialization by sending a success message.

				const response: WebSocketMessage = {
					action: 'init',
					module: 'sla-explorer',
					status: 'complete',
				};

				socket.send(JSON.stringify(response));

				return;

				//
			}

			//
		});
	});
};
