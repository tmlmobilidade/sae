/* * */

import { type ExportToHitouchConfig, type RoutesToCanvasExt } from '@/types.js';
import { type GtfsRoutes } from '@tmlmobilidade/go-types-gtfs';
import { type GtfsStrictV29ExtRoutes } from '@tmlmobilidade/go-types-gtfs-strict';
import { type GtfsStrictV29ExtSQLTables } from '@tmlmobilidade/import-gtfs';
import { Logger } from '@tmlmobilidade/logger';
import { CsvWriter } from '@tmlmobilidade/writers';
import fs from 'node:fs';
import Papa from 'papaparse';

/* * */

export async function exportRoutesFile(sqlTables: GtfsStrictV29ExtSQLTables, exportConfig: ExportToHitouchConfig) {
	//
	// Export routes.txt

	const routesCsv = new CsvWriter('routes.txt', `${exportConfig.workdir}/routes.txt`, { batch_size: 100000 });

	//
	// Get all routes and group them by line_id

	const routesByLineId: Record<string, GtfsStrictV29ExtRoutes[]> = {};

	sqlTables.routes.all().forEach((route) => {
		if (!routesByLineId[route.line_id]) routesByLineId[route.line_id] = [];
		routesByLineId[route.line_id].push(route);
	});

	for (const routesGroup of Object.values(routesByLineId)) {
		// If this line only has one route, export it as is
		if (routesGroup.length === 1) {
			const data: GtfsRoutes = {
				agency_id: routesGroup[0].agency_id,
				route_color: routesGroup[0].route_color,
				route_desc: routesGroup[0].route_desc,
				route_id: routesGroup[0].route_id,
				route_long_name: routesGroup[0].route_long_name,
				route_short_name: routesGroup[0].route_short_name,
				route_text_color: routesGroup[0].route_text_color,
				route_type: routesGroup[0].route_type,
			};
			await routesCsv.write(data);
			continue;
		}
		// If this line has multiple routes, sort them by route_id
		// and add a suffix (A, B, C, ...) to the route_short_name
		// to differentiate between them.
		routesGroup.sort((a, b) => (a.route_id < b.route_id ? -1 : 1));
		for (let i = 0; i < routesGroup.length; i++) {
			const data: GtfsRoutes = {
				agency_id: routesGroup[i].agency_id,
				route_color: routesGroup[i].route_color,
				route_desc: routesGroup[i].route_desc,
				route_id: routesGroup[i].route_id,
				route_long_name: routesGroup[i].route_long_name,
				route_short_name: `${routesGroup[i].route_short_name}${String.fromCharCode(65 + i)}`, // 65 is 'A' in ASCII
				route_text_color: routesGroup[i].route_text_color,
				route_type: routesGroup[i].route_type,
			};
			await routesCsv.write(data);
		}
	}

	await routesCsv.flush();

	Logger.info({ message: 'Exported routes.txt file.' });

	//
	// Export route canvas profiles by route and direction.

	const routesToCanvasExtFields: (keyof RoutesToCanvasExt)[] = ['route_id', 'canvas_profile', 'direction_id'];
	const stopPlaceholders = exportConfig.stop_ids.map(() => '?').join(', ');
	const isStopExport = exportConfig.content_mode === 'stops' && exportConfig.stop_ids.length > 0;
	const canvasJoin = isStopExport ? 'INNER JOIN stop_times ON stop_times.trip_id = trips.trip_id' : '';
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
	const routesToCanvasExtRows = sqlTables._db.databaseInstance.prepare(
		` SELECT DISTINCT trips.route_id, trips.direction_id
		FROM trips
		${canvasJoin}
		${canvasFilter}
		ORDER BY trips.route_id ASC, trips.direction_id ASC `,
	).all(...canvasFilterParameters).map((row: { direction_id: number, route_id: string }): RoutesToCanvasExt => ({
		canvas_profile: '08.01.RouteTimeTable.001',
		direction_id: row.direction_id,
		route_id: row.route_id,
	}));

	//
	// If no route directions were found, skip the export

	if (!routesToCanvasExtRows.length) return Logger.info({ message: 'Skipped routesToCanvasExt.txt file because no route directions were found.' });

	//
	// Output the routes to canvas ext data

	const routesToCanvasExtCsvData = '\uFEFF' + Papa.unparse(
		{ data: routesToCanvasExtRows, fields: routesToCanvasExtFields },
		{ newline: '\r\n' },
	);

	//
	// Output the routes to canvas ext file

	fs.writeFileSync(`${exportConfig.workdir}/routesToCanvasExt.txt`, routesToCanvasExtCsvData, { encoding: 'utf-8', flush: true });

	Logger.info({ message: 'Exported routesToCanvasExt.txt file.' });

	//
}
