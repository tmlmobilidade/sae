/* * */

import { rides } from '@tmlmobilidade/core/interfaces';
import { type WebSocketMessage } from '@tmlmobilidade/core/types';
import { WebSocket } from 'ws';

/* * */

export const watchRides = async (socket: WebSocket) => {
	//

	const ridesCollection = await rides.getCollection();

	ridesCollection
		.watch([], { fullDocument: 'updateLookup' })
		.on('change', async (databaseOperation) => {
			//

			//
			// When a change is detected, send it to the client.

			if (typeof databaseOperation['fullDocument'] === 'undefined') {
				console.log('Undefined document:', databaseOperation);
				return;
			}

			const changedDocument = databaseOperation['fullDocument'];

			const message: WebSocketMessage = {
				action: 'change',
				data: JSON.stringify(changedDocument),
				module: 'sla-explorer',
				status: 'response',
			};

			socket.send(JSON.stringify(message));
		});
};
