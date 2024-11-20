/* * */

import SLAMANAGERBRIDGEDB from '@/services/SLAMANAGERBRIDGEDB.js';
import SLAMANAGERBUFFERDB from '@/services/SLAMANAGERBUFFERDB.js';
import SLAMANAGERDB from '@/services/SLAMANAGERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

async function createTableFromExample(tripAnalysisParsed) {
	const keys = Object.keys(tripAnalysisParsed);
	const createTableQuery = `
        CREATE TABLE IF NOT EXISTS trip_analysis (
            ${keys.map(key => `${key} TEXT`).join(',')}
        );
    `;
	await SLAMANAGERBRIDGEDB.client.query(createTableQuery);
	//
	const createTableIndex = `
        CREATE UNIQUE INDEX IF NOT EXISTS code_idx ON trip_analysis ("code");
    `;
	await SLAMANAGERBRIDGEDB.client.query(createTableIndex);
}

/* * */

function parseTripAnalysis(tripAnalysis) {
	const parsed = {
		agency_id: tripAnalysis.agency_id,
		archive_id: tripAnalysis.archive_id,
		code: tripAnalysis.code,
		line_id: tripAnalysis.line_id,
		operational_day: tripAnalysis.operational_day,
		pattern_id: tripAnalysis.pattern_id,
		route_id: tripAnalysis.route_id,
		scheduled_start_time: tripAnalysis.scheduled_start_time,
		service_id: tripAnalysis.service_id,
		trip_id: tripAnalysis.trip_id,
		user_notes: tripAnalysis.user_notes,
	};

	tripAnalysis.analysis.forEach((item) => {
		// parsed[`${item.code}_status`] = item.status;
		parsed[`${item.code}_grade`] = item.grade;
		parsed[`${item.code}_reason`] = item.reason;
		// parsed[`${item.code}_message`] = item.message;
		// parsed[`${item.code}_unit`] = item.unit;
		parsed[`${item.code}_value`] = item.value;
	});

	return parsed;
}

/* * */

export default async () => {
	try {
		LOGGER.init();
		const globalTimer = new TIMETRACKER();

		LOGGER.info('Connecting to databases...');
		await Promise.all([
			SLAMANAGERDB.connect(),
			SLAMANAGERBUFFERDB.connect(),
			SLAMANAGERBRIDGEDB.connect(),
		]);

		LOGGER.divider();
		LOGGER.info('Creating TripAnalysis tables...');

		const exampleTripAnalysis = await SLAMANAGERDB.TripAnalysis.findOne();
		if (!exampleTripAnalysis) {
			throw new Error('No example trip analysis found.');
		}

		const tripAnalysisParsed = parseTripAnalysis(exampleTripAnalysis);
		await createTableFromExample(tripAnalysisParsed);

		const allTripAnalysesStream = SLAMANAGERDB.TripAnalysis.find().sort({ operational_day: -1 }).stream();
		for await (const tripAnalysis of allTripAnalysesStream) {
			console.log(`Writing trip analysis "${tripAnalysis.code}" ...`);
			const parsedTripAnalysis = parseTripAnalysis(tripAnalysis);
			await SLAMANAGERBRIDGEDB.client.query(`
				INSERT INTO trip_analysis (${Object.keys(parsedTripAnalysis).join(',')})
				VALUES (${Object.values(parsedTripAnalysis).map(value => `'${value}'`).join(',')})
				ON CONFLICT (code) DO UPDATE SET ${Object.keys(parsedTripAnalysis).map(key => `${key} = EXCLUDED.${key}`).join(',')};
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
