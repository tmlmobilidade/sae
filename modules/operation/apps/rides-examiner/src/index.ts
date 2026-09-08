/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type RidesCoordinatorRidesResponse } from '@tmlmobilidade/go-operation-pckg-types';
import { getCoordinatorUrl } from '@tmlmobilidade/go-operation-pckg-utils';
import { runOnInterval, runWithConcurrency } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { examineRide } from './tasks/examine-ride.js';

/* * */

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'rides-examiner', message: 'Sentry Rides Examiner initialized', module: 'controller', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Rides Examiner' });
}

/* * */

export async function main() {
	//

	//
	// Initialize the logger

	Logger.init();

	const globalTimer = new Timer();

	//
	// Ask the coordinator for a batch of Ride IDs to process

	const fetchCoordinatorTimer = new Timer();

	const rideIdsBatch = await fetch(getCoordinatorUrl('rides'))
		.then(response => response.json())
		.then(data => data as RidesCoordinatorRidesResponse)
		.then(data => data.ride_ids);

	const fetchCoordinatorTimerResult = fetchCoordinatorTimer.get();

	//
	// With the list of Ride IDs, fetch the actual Ride documents to be processsed

	const fetchRideDocumentsTimer = new Timer();

	const ridesBatch = await goDb.operation.rides.findMany({ _id: { $in: rideIdsBatch || [] } });

	Logger.info({ message: `Processing ${ridesBatch.length} rides... (coordinator: ${fetchCoordinatorTimerResult} | interface: ${fetchRideDocumentsTimer.get()})`, spacesAfterOrBefore: 1 });

	//
	// Process each Ride

	await runWithConcurrency(ridesBatch, 100, async (data, index) => {
		await examineRide(data, index, ridesBatch.length);
	});

	//
	// Send a signal to the uptime monitor

	void fetch('https://status.carrismetropolitana.pt/api/push/B52rdR5Luo30Y1RAtCpHDrn4MF7vXCZb');

	Logger.terminate(`Run took ${globalTimer.get()}.`);

	//
};

/* * */

await runOnInterval(main, { intervalMs: '1s' });
