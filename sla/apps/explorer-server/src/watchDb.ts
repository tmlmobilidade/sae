/* * */

import { rides } from '@tmlmobilidade/services/interfaces';
import { WebSocket } from 'ws';

/* * */

export const watchDb = async (socket: WebSocket) => {
	const ridesCollection = await rides.getCollection();

	ridesCollection.watch().on('change', (changeData) => {
		console.log('change received');
		// socket.send(JSON.stringify(changeData));
	});
};
