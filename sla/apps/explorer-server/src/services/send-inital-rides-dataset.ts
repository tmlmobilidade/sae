/* * */

import { rides } from '@tmlmobilidade/core/interfaces';
import { type WebSocketMessage } from '@tmlmobilidade/core/types';
import { getOperationalDate } from '@tmlmobilidade/core/utils';
import { WebSocket } from 'ws';

/* * */

export const sendInitalRidesDataset = async (socket: WebSocket) => {
	//

	//
	// The initial dataset is comprised of all rides for today.

	const ridesCollection = await rides.getCollection();

	const allRidesToday = ridesCollection
		// .find({ operational_date: getOperationalDate(), start_time_scheduled: { $gte: DateTime.now().minus({ hour: 1 }).toJSDate() } })
		.find({ operational_date: getOperationalDate() })
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

	//
};
