/* * */

import { GtfsStrictV30Shapes, GtfsStrictV30Trips } from '@tmlmobilidade/go-types-gtfs-strict';
import { BatchWriter, streamCsvFile } from '@tmlmobilidade/go-utils-exec';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';
import { stringify as csvStringify } from 'csv-stringify/sync';
import fs from 'node:fs';
import path, { join } from 'node:path';

import { type NormalizePlansTaskContext } from '../context/init-context.js';

/**
 * Rewrites the `shape_id` values of trips.txt and shapes.txt to match the `pattern_id`
 * of each trip. Both files are streamed row by row through the given working directory,
 * since a GTFS feed can hold millions of rows.
 * The `pattern_id` column is a TML extension, so feeds without it are left untouched.
 * The rewritten files are added to the archive as read streams, so the working directory
 * must outlive the archive generation.
 * @returns True if the zip archive was updated.
 */
export async function rewriteShapeIdsToPatternIds(context: NormalizePlansTaskContext): Promise<void> {
	//

	//
	// Set up a map to collect the shape_id -> pattern_id relationships.

	const shapeIdToPatternIdMap = new Map<string, string>();

	//
	// Prepare the output directory.

	const outputFilePath = join(context.paths.base_dir_path, 'output');

	try {
		fs.rmSync(outputFilePath, { force: true, recursive: true });
		fs.mkdirSync(outputFilePath, { recursive: true });
		Logger.success(`Prepared output directory at "${outputFilePath}".`, 1);
	} catch (error) {
		Logger.error({ error, message: `Error preparing output path "${outputFilePath}".` });
		process.exit(1);
	}

	//
	// Initialize the writers for the trips.txt and shapes.txt files.

	const tripsWriter = new BatchWriter({
		batch_size: 100_000,
		insertFn: async (data) => {
			const dirPath = `${outputFilePath}/trips.txt`;
			const fileAlreadyExists = fs.existsSync(dirPath);
			let csvData = csvStringify(data, { header: !fileAlreadyExists });
			if (fileAlreadyExists) csvData = '\n' + csvData;
			fs.appendFileSync(dirPath, csvData, { encoding: 'utf-8', flush: true });
		},
		title: 'trips',
	});

	const shapesWriter = new BatchWriter({
		batch_size: 100_000,
		insertFn: async (data) => {
			const dirPath = `${outputFilePath}/shapes.txt`;
			const fileAlreadyExists = fs.existsSync(dirPath);
			let csvData = csvStringify(data, { header: !fileAlreadyExists });
			if (fileAlreadyExists) csvData = '\n' + csvData;
			fs.appendFileSync(dirPath, csvData, { encoding: 'utf-8', flush: true });
		},
		title: 'shapes',
	});

	//
	// Parse the trips.txt file, collecting the shape_id to pattern_id mapping.

	const tripsTimer = new Timer();

	Logger.info({ message: 'Reading zip entry "trips.txt"...' });

	const parseEachTripsRow = async (data: GtfsStrictV30Trips) => {
		// Setup the new value for the
		// pattern_id and shape_id columns
		let newIdValue: string;
		// If this row does not have a pattern_id,
		// then it should match the value of shape_id
		if (!('pattern_id' in data && typeof data.pattern_id === 'string')) {
			newIdValue = data.shape_id;
		} else {
			// Otherwise, shape_id should match the value
			// of the existing pattern_id column
			newIdValue = data.pattern_id;
		}
		// Update the map and write the row to the output file
		shapeIdToPatternIdMap.set(data.shape_id, newIdValue);
		await tripsWriter.write({ ...data, pattern_id: newIdValue, shape_id: newIdValue });
	};

	await streamCsvFile(path.join(context.paths.extracted_dir_path, 'trips.txt'), parseEachTripsRow);

	await tripsWriter.flush();

	Logger.success(`Finished processing "trips.txt" in ${tripsTimer.get()}.`, 1);

	//
	// Parse the shapes.txt file, writing the rows to the output file.

	const shapesTimer = new Timer();

	Logger.info({ message: 'Reading zip entry "shapes.txt"...' });

	const parseEachShapesRow = async (data: GtfsStrictV30Shapes) => {
		// Get the current shape_id and pattern_id values
		const currentShapeId = data.shape_id;
		const currentPatternId = shapeIdToPatternIdMap.get(currentShapeId);
		// Update the map and write the row to the output file
		await shapesWriter.write({ ...data, shape_id: currentPatternId || data.shape_id });
	};

	await streamCsvFile(path.join(context.paths.extracted_dir_path, 'shapes.txt'), parseEachShapesRow);

	await shapesWriter.flush();

	Logger.success(`Finished processing "shapes.txt" in ${shapesTimer.get()}.`, 1);

	//
	// Replace the original trips.txt and shapes.txt files with the new ones.

	fs.rmSync(path.join(context.paths.extracted_dir_path, 'trips.txt'), { force: true });
	fs.rmSync(path.join(context.paths.extracted_dir_path, 'shapes.txt'), { force: true });

	fs.renameSync(path.join(outputFilePath, 'trips.txt'), path.join(context.paths.extracted_dir_path, 'trips.txt'));
	fs.renameSync(path.join(outputFilePath, 'shapes.txt'), path.join(context.paths.extracted_dir_path, 'shapes.txt'));

	Logger.success(`Replaced original trips.txt and shapes.txt files with the new ones.`, 1);

	//
}
