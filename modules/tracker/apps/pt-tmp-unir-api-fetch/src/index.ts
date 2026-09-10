/* * */

import { externalClients } from '@tmlmobilidade/external';
import { UnirVehicleLocationResponse } from '@tmlmobilidade/external/dist/clients/unir/types.js';
import { rawDb } from '@tmlmobilidade/go-interfaces-rawdb';
import { type HashableRawVehicleEvent, type RawVehicleEventPtTmpUnir } from '@tmlmobilidade/go-types-vehicle-events';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { runOnInterval } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';
import crypto from 'node:crypto';

import { ut1Writer, ut2Writer, ut3Writer, ut4Writer, ut5Writer } from './writers.js';

/* * */

let ITERATION = 0;

const AGENCY_NAME_ID_MAP = {
	'UT1 - VIANORBUS': {
		collection: 'ptTmpUnirUt1',
		id: 'KJTOU',
		version: 'pt-tmp-unir-ut1-v1',
	},
	'UT2 - NEX': {
		collection: 'ptTmpUnirUt2',
		id: '1H6XC',
		version: 'pt-tmp-unir-ut2-v1',
	},
	'UT3 - Porto Mobilidade': {
		collection: 'ptTmpUnirUt3',
		id: 'OP1VZ',
		version: 'pt-tmp-unir-ut3-v1',
	},
	'UT4 - Transportes Beira Douro': {
		collection: 'ptTmpUnirUt4',
		id: 'VZAS3',
		version: 'pt-tmp-unir-ut4-v1',
	},
	'UT5 - XERBUS': {
		collection: 'ptTmpUnirUt5',
		id: '8NDX4',
		version: 'pt-tmp-unir-ut5-v1',
	},
	// 'UT6 - Transporte Fluvial': {
	// 	collection: 'ptTmpUnirUt6',
	// 	id: 'VZAS3',
	// 	version: 'pt-tmp-unir-ut6-v1',
	// },
} as const;

/* * */

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'pt-tmp-unir-api-fetch', message: 'Sentry Tracker TMP UNIR Fetch initialized', module: 'tracker', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Tracker TMP UNIR Fetch' });
}

const main = async () => {
	//

	const timer = new Timer();
	let saveCount = 0;

	//

	Logger.info({ message: `[${ITERATION}] Fetching TMP UNIR data from API...`, spacesAfterOrBefore: 1, spacesBefore: 0 });

	let response: UnirVehicleLocationResponse;
	try {
		response = await externalClients.unir.vehiclePositions();
	} catch (error) {
		Logger.error({ error, message: `[${ITERATION}] Error fetching TMP UNIR data from API:` });
		return;
	}

	Logger.info({ message: `[${ITERATION}] Found ${response.message.length ?? 0} Vehicle Events in the TMP UNIR data.` });

	for (const event of response.message) {
		//

		const hashableRawEventHash = crypto
			.createHash('sha256')
			.update(JSON.stringify(event))
			.digest('hex');

		const hashableRawEvent: HashableRawVehicleEvent<RawVehicleEventPtTmpUnir> = {
			agency_id: AGENCY_NAME_ID_MAP[event.nomeOperador].id,
			created_at: Dates.fromFormat(event.recordedAtTime, 'yyyy-MM-dd HH:mm:ss', 'Europe/Lisbon').unix_milliseconds,
			entity_id: hashableRawEventHash,
			payload: event,
			version: AGENCY_NAME_ID_MAP[event.nomeOperador].version,
		};

		//
		const collection = AGENCY_NAME_ID_MAP[event.nomeOperador].collection;

		const alreadyExists = await rawDb.vehicleEvents[collection].findOne({ _id: hashableRawEventHash });

		if (alreadyExists) continue;

		const insertableDocument = {
			...hashableRawEvent,
			_id: hashableRawEventHash,
			received_at: Dates.now('Europe/Lisbon').unix_milliseconds,
		} as typeof insertableDocument[number];

		if (collection === 'ptTmpUnirUt1') await ut1Writer.write(insertableDocument);
		if (collection === 'ptTmpUnirUt2') await ut2Writer.write(insertableDocument);
		if (collection === 'ptTmpUnirUt3') await ut3Writer.write(insertableDocument);
		if (collection === 'ptTmpUnirUt4') await ut4Writer.write(insertableDocument);
		if (collection === 'ptTmpUnirUt5') await ut5Writer.write(insertableDocument);

		saveCount++;
	}

	Logger.info({ message: `[${ITERATION}] Saved ${saveCount} new Vehicle Events from TMP UNIR data in ${timer.get()}.` });

	ITERATION++;

	//
};

/* * */

await runOnInterval(main, { intervalMs: '1s', throwOnError: false });
