/* * */

import { rides } from '@tmlmobilidade/core/interfaces';
import { createOperationalDate, OPERATIONAL_DATE_FORMAT, WebSocketMessage } from '@tmlmobilidade/core/types';
import { DateTime } from 'luxon';
import { WebSocket } from 'ws';

/* * */

export const sendInitalRidesDataset = async (socket: WebSocket) => {
	//

	//
	// The initial dataset is comprised of all rides for today.

	const ridesCollection = await rides.getCollection();

	const allRidesToday = ridesCollection
		.find({ operational_date: createOperationalDate(DateTime.now().toFormat(OPERATIONAL_DATE_FORMAT)) })
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
