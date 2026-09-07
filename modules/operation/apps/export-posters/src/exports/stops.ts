/* * */

import { type ExportToHitouchConfig, type StopsToCanvasExt } from '@/types.js';
import { type GtfsStrictV29ExtStops } from '@tmlmobilidade/go-types-gtfs-strict';
import { type GtfsStrictV29ExtSQLTables } from '@tmlmobilidade/import-gtfs';
import { Logger } from '@tmlmobilidade/logger';
import { CsvWriter } from '@tmlmobilidade/writers';
import fs from 'node:fs';
import Papa from 'papaparse';

/* * */

export async function exportStopsFile(sqlTables: GtfsStrictV29ExtSQLTables, exportConfig: ExportToHitouchConfig) {
	//
	// Export stops.txt

	const stopsCsv = new CsvWriter('stops.txt', `${exportConfig.workdir}/stops.txt`, { batch_size: 100000 });

	for (const stopData of sqlTables.stops.all('WHERE stop_id IN (SELECT DISTINCT stop_id FROM stop_times)')) {
		const data: GtfsStrictV29ExtStops = {
			location_type: stopData.location_type,
			parent_station: stopData.parent_station,
			platform_code: stopData.platform_code,
			stop_code: stopData.stop_code,
			stop_desc: stopData.stop_desc,
			stop_id: stopData.stop_id,
			stop_lat: stopData.stop_lat,
			stop_lon: stopData.stop_lon,
			stop_name: stopData.stop_name,
			stop_timezone: stopData.stop_timezone,
			stop_url: stopData.stop_url,
			wheelchair_boarding: stopData.wheelchair_boarding,
		};
		await stopsCsv.write(data);
	}

	await stopsCsv.flush();

	Logger.info({ message: 'Exported stops.txt file.' });

	//
	// Export stop canvas profiles by stop and direction.

	const stopsToCanvasExtFields: (keyof StopsToCanvasExt)[] = ['stop_id', 'canvas_profile', 'direction_id'];
	const stopPlaceholders = exportConfig.stop_ids.map(() => '?').join(', ');
	const isStopExport = exportConfig.content_mode === 'stops' && exportConfig.stop_ids.length > 0;
	const canvasFilter = isStopExport
		? `WHERE stop_times.stop_id ${exportConfig.stops_mode === 'exclude' ? 'NOT IN' : 'IN'} (${stopPlaceholders})`
		: '';
	const canvasFilterParameters = isStopExport ? exportConfig.stop_ids : [];

	// Line filtering is temporarily disabled while PDF exports use stop filters only.
	// const lineIdMatchExpression = exportConfig.line_codes
	// 	.map(() => '(CAST(routes.line_id AS TEXT) = ? OR CAST(routes.line_id AS TEXT) GLOB ?)')
	// 	.join(' OR ');
	// const lineIdMatchParameters = exportConfig.line_codes.flatMap(lineCode => [lineCode, `${lineCode}_*`]);
	// const isLineExport = exportConfig.content_mode === 'lines' && exportConfig.line_codes.length > 0;
	// const lineJoin = isLineExport ? 'INNER JOIN routes ON routes.route_id = trips.route_id' : '';
	// const lineFilter = isLineExport ? `WHERE ${exportConfig.lines_mode === 'exclude' ? 'NOT' : ''} (${lineIdMatchExpression})` : '';
	const stopsToCanvasExtRows = sqlTables._db.databaseInstance.prepare(
		` SELECT DISTINCT stop_times.stop_id, trips.direction_id
		FROM stop_times
		INNER JOIN trips ON trips.trip_id = stop_times.trip_id
		${canvasFilter}
		ORDER BY stop_times.stop_id ASC, trips.direction_id ASC `,
	).all(...canvasFilterParameters).map((row: { direction_id: number, stop_id: string }): StopsToCanvasExt => ({
		canvas_profile: exportConfig.canvas_profile,
		direction_id: row.direction_id,
		stop_id: row.stop_id,
	}));

	//
	// If no stop directions were found, skip the export

	if (!stopsToCanvasExtRows.length) {
		if (exportConfig.content_mode === 'stops') {
			throw new Error('The selected stop filter removes every stop poster target.');
		}
		return Logger.info({ message: 'Skipped stopsToCanvasExt.txt file because no stop directions were found.' });
	}

	//
	// Output the stops to canvas ext data

	const stopsToCanvasExtCsvData = '\uFEFF' + Papa.unparse(
		{ data: stopsToCanvasExtRows, fields: stopsToCanvasExtFields },
		{
			newline: '\r\n',
			quotes: (value, columnIndex) => columnIndex === 0 && !stopsToCanvasExtFields.includes(value as keyof StopsToCanvasExt),
		},
	);

	//
	// Output the stops to canvas ext file

	fs.writeFileSync(`${exportConfig.workdir}/stopsToCanvasExt.txt`, stopsToCanvasExtCsvData, { encoding: 'utf-8', flush: true });

	Logger.info({ message: 'Exported stopsToCanvasExt.txt file.' });

	//
}
