/* * */

import { type ExportGtfsContext } from '@/types/context.js';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { BatchWriter } from '@tmlmobilidade/go-utils-exec';
import { stringify as csvStringify } from 'csv-stringify/sync';
import fs from 'node:fs';

/**
 * Initializes the context for the GTFS export process.
 * @returns The initialized context for the GTFS export process.
 */
export function initExportGtfsContext(): ExportGtfsContext {
	//

	//
	// Generate a timestamp string to be used as the
	// identifier for this export run.

	const runId = Dates.now('Europe/Lisbon').toFormat('yyyyLLdd-HHmm-ss');

	//
	// Use the run ID to prepare the working directory.

	const temporaryPath = fs.mkdtempDisposableSync(`export-gtfs-${runId}`);

	const workdirContext: ExportGtfsContext['workdir'] = {
		path: temporaryPath.path,
		remove: temporaryPath.remove,
	};

	//
	// Setup the writers for each GTFS file.

	const writersContext: ExportGtfsContext['writers'] = {

		agency: new BatchWriter({
			batch_size: 100_000,
			insertFn: async (data) => {
				const dirPath = `${workdirContext.path}/agency.txt`;
				const fileAlreadyExists = fs.existsSync(dirPath);
				const csvData = csvStringify(data, { header: !fileAlreadyExists });
				fs.appendFileSync(dirPath, csvData, { encoding: 'utf-8', flush: true });
			},
			title: 'agency',
		}),

		calendar_dates: new BatchWriter({
			batch_size: 100_000,
			insertFn: async (data) => {
				const dirPath = `${workdirContext.path}/calendar_dates.txt`;
				const fileAlreadyExists = fs.existsSync(dirPath);
				const csvData = csvStringify(data, { header: !fileAlreadyExists });
				fs.appendFileSync(dirPath, csvData, { encoding: 'utf-8', flush: true });
			},
			title: 'calendar_dates',
		}),

		feed_info: new BatchWriter({
			batch_size: 100_000,
			insertFn: async (data) => {
				const dirPath = `${workdirContext.path}/feed_info.txt`;
				const fileAlreadyExists = fs.existsSync(dirPath);
				const csvData = csvStringify(data, { header: !fileAlreadyExists });
				fs.appendFileSync(dirPath, csvData, { encoding: 'utf-8', flush: true });
			},
			title: 'feed_info',
		}),

		plans: new BatchWriter({
			batch_size: 100_000,
			insertFn: async (data) => {
				const dirPath = `${workdirContext.path}/plans.txt`;
				const fileAlreadyExists = fs.existsSync(dirPath);
				const csvData = csvStringify(data, { header: !fileAlreadyExists });
				fs.appendFileSync(dirPath, csvData, { encoding: 'utf-8', flush: true });
			},
			title: 'plans',
		}),

		routes: new BatchWriter({
			batch_size: 100_000,
			insertFn: async (data) => {
				const dirPath = `${workdirContext.path}/routes.txt`;
				const fileAlreadyExists = fs.existsSync(dirPath);
				const csvData = csvStringify(data, { header: !fileAlreadyExists });
				fs.appendFileSync(dirPath, csvData, { encoding: 'utf-8', flush: true });
			},
			title: 'routes',
		}),

		shapes: new BatchWriter({
			batch_size: 100_000,
			insertFn: async (data) => {
				const dirPath = `${workdirContext.path}/shapes.txt`;
				const fileAlreadyExists = fs.existsSync(dirPath);
				const csvData = csvStringify(data, { header: !fileAlreadyExists });
				fs.appendFileSync(dirPath, csvData, { encoding: 'utf-8', flush: true });
			},
			title: 'shapes',
		}),

		stop_times: new BatchWriter({
			batch_size: 100_000,
			insertFn: async (data) => {
				const dirPath = `${workdirContext.path}/stop_times.txt`;
				const fileAlreadyExists = fs.existsSync(dirPath);
				const csvData = csvStringify(data, { header: !fileAlreadyExists });
				fs.appendFileSync(dirPath, csvData, { encoding: 'utf-8', flush: true });
			},
			title: 'stop_times',
		}),

		stops: new BatchWriter({
			batch_size: 100_000,
			insertFn: async (data) => {
				const dirPath = `${workdirContext.path}/stops.txt`;
				const fileAlreadyExists = fs.existsSync(dirPath);
				const csvData = csvStringify(data, { header: !fileAlreadyExists });
				fs.appendFileSync(dirPath, csvData, { encoding: 'utf-8', flush: true });
			},
			title: 'stops',
		}),

		trips: new BatchWriter({
			batch_size: 100_000,
			insertFn: async (data) => {
				const dirPath = `${workdirContext.path}/trips.txt`;
				const fileAlreadyExists = fs.existsSync(dirPath);
				const csvData = csvStringify(data, { header: !fileAlreadyExists });
				fs.appendFileSync(dirPath, csvData, { encoding: 'utf-8', flush: true });
			},
			title: 'trips',
		}),

	};

	//
	// Return the initialized context.

	return {
		run_id: runId,
		workdir: workdirContext,
		writers: writersContext,
	};
}
