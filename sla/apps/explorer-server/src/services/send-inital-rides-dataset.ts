/* * */

import { rides } from '@tmlmobilidade/core/interfaces';
import { createOperationalDate, WebSocketMessage } from '@tmlmobilidade/core/types';
import { WebSocket } from 'ws';

/* * */

export const sendInitalRidesDataset = async (socket: WebSocket) => {
	//

	//
	// The initial dataset is comprised of all rides for today.

	const ridesCollection = await rides.getCollection();

	const allRidesToday = ridesCollection
		.find({ operational_date: createOperationalDate('20250129') })
		.stream();

	for await (const ride of allRidesToday) {
		const message: WebSocketMessage = {
			action: 'change',
			data: JSON.stringify(ride),
			module: 'sla-explorer',
			status: 'response',
		};

		socket.send(JSON.stringify(message));
	}

	// const message: WebSocketMessage = {
	// 	action: 'init',
	// 	data: JSON.stringify(latest1000Rides),
	// 	module: 'sla-explorer',
	// 	status: 'response',
	// };

	// socket.send(JSON.stringify(message));

	//
};
