/* * */

import BRIDGEDB from '@/services/BRIDGEDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { rides } from '@tmlmobilidade/services/interfaces';
import { getOperationalDate } from '@tmlmobilidade/services/utils';

/* * */

async function createTableFromExample(rideDataParsed) {
	const keys = Object.keys(rideDataParsed);
	const createTableQuery = `
        CREATE TABLE IF NOT EXISTS rides (
            ${keys.map(key => `${key} TEXT`).join(',')}
        );
    `;
	await BRIDGEDB.client.query(createTableQuery);
	//
	const createTableIndex = `
        CREATE UNIQUE INDEX IF NOT EXISTS _id_idx ON rides ("_id");
    `;
	await BRIDGEDB.client.query(createTableIndex);
}

/* * */

function parseRide(rideData) {
	const parsed = {
		_id: rideData._id,
		agency_id: rideData.agency_id,
		archive_id: rideData.archive_id,
		line_id: rideData.line_id,
		operational_day: rideData.operational_day,
		pattern_id: rideData.pattern_id,
		route_id: rideData.route_id,
		scheduled_start_time: rideData.scheduled_start_time,
		service_id: rideData.service_id,
		trip_id: rideData.trip_id,
		user_notes: rideData.user_notes,
	};

	rideData.analysis.forEach((item) => {
		// parsed[`${item._id}_status`] = item.status;
		parsed[`${item._id}_grade`] = item.grade;
		parsed[`${item._id}_reason`] = item.reason;
		// parsed[`${item._id}_message`] = item.message;
		// parsed[`${item._id}_unit`] = item.unit;
		parsed[`${item._id}_value`] = item.value;
	});

	return parsed;
}

/* * */

export async function syncRides() {
	try {
		LOGGER.init();
		const globalTimer = new TIMETRACKER();

		LOGGER.info('Connecting to databases...');
		await BRIDGEDB.connect();

		LOGGER.divider();
		LOGGER.info('Creating ride table...');

		const exampleRide = await rides.findOne({ status: 'complete' });
		if (!exampleRide) {
			throw new Error('No example ride found.');
		}

		const rideDataParsed = parseRide(exampleRide);
		await createTableFromExample(rideDataParsed);

		const ridesCollection = await rides.getCollection();

		const todaysOperationalDate = getOperationalDate();

		const allRidesStream = ridesCollection
			.find({ operational_date: { $lte: todaysOperationalDate } })
			.sort({ operational_day: -1 })
			.stream();

		for await (const rideData of allRidesStream) {
			console.log(`Writing ride "${rideData._id}" ...`);
			const parsedRide = parseRide(rideData);
			await BRIDGEDB.client.query(`
				INSERT INTO rides (${Object.keys(parsedRide).join(',')})
				VALUES (${Object.values(parsedRide).map(value => `'${value}'`).join(',')})
				ON CONFLICT (_id) DO UPDATE SET ${Object.keys(parsedRide).map(key => `${key} = EXCLUDED.${key}`).join(',')};
			`);
		}

		LOGGER.terminate(`Run took ${globalTimer.get()}.`);
	}
	catch (err) {
		LOGGER.error('An error occurred. Halting execution.', err);
		LOGGER.info('Retrying in 10 seconds...');
		setTimeout(() => process.exit(1), 10000);
	}
};
