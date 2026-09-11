/* * */

import { type ExportToHitouchConfig, type RoutesToCanvasExt } from '@/types.js';
import { getPosterRouteId } from '@/utils/get-poster-route-id.js';
import { GtfsRoutesSchema } from '@tmlmobilidade/go-types-gtfs';
import { type GtfsStrictV29ExtRoutes } from '@tmlmobilidade/go-types-gtfs-strict';
import { type GtfsStrictV29ExtSQLTables } from '@tmlmobilidade/import-gtfs';
import { Logger } from '@tmlmobilidade/logger';
import { CsvWriter } from '@tmlmobilidade/writers';
import fs from 'node:fs';
import Papa from 'papaparse';

/* * */

export async function exportRoutesFile(sqlTables: GtfsStrictV29ExtSQLTables, exportConfig: ExportToHitouchConfig): Promise<Map<string, string>> {
	//
	// Export routes.txt

	const routesCsv = new CsvWriter('routes.txt', `${exportConfig.workdir}/routes.txt`, { batch_size: 100000 });

	//
	// Keep one route per base ID, preferring the main (_0) route's metadata.
	// Sorting gives a stable fallback when a family has no _0 route.

	const mainRoutes = new Map<string, GtfsStrictV29ExtRoutes>();
	const routeIds = new Map<string, string>();

	for (const route of sqlTables.routes.all('ORDER BY route_id ASC')) {
		const routeId = getPosterRouteId(route.route_id);
		routeIds.set(route.route_id, routeId);
		if (!mainRoutes.has(routeId) || route.route_id === `${routeId}_0`) {
			mainRoutes.set(routeId, route);
		}
	}

	for (const [routeId, route] of mainRoutes) {
		const data = GtfsRoutesSchema.parse({
			agency_id: route.agency_id,
			route_color: route.route_color,
			route_desc: route.route_desc ?? '',
			route_id: routeId,
			route_long_name: route.route_long_name,
			route_short_name: route.route_short_name,
			route_text_color: route.route_text_color,
			route_type: route.route_type,
		});
		await routesCsv.write(data);
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
	).all(...canvasFilterParameters).map((row: { direction_id: number, route_id: string }): RoutesToCanvasExt => {
		const routeId = routeIds.get(row.route_id);
		if (!routeId) throw new Error(`Cannot export canvas target: route ${row.route_id} was not exported.`);
		return {
			canvas_profile: '08.01.RouteTimeTable.001',
			direction_id: row.direction_id,
			route_id: routeId,
		};
	});
	const uniqueRoutesToCanvasExtRows = Array.from(new Map(
		routesToCanvasExtRows.map(row => [JSON.stringify([row.route_id, row.direction_id]), row]),
	).values());

	//
	// If no route directions were found, skip the export

	if (!routesToCanvasExtRows.length) {
		Logger.info({ message: 'Skipped routesToCanvasExt.txt file because no route directions were found.' });
		return routeIds;
	}

	//
	// Output the routes to canvas ext data

	const routesToCanvasExtCsvData = '\uFEFF' + Papa.unparse(
		{ data: uniqueRoutesToCanvasExtRows, fields: routesToCanvasExtFields },
		{ newline: '\r\n' },
	);

	//
	// Output the routes to canvas ext file

	fs.writeFileSync(`${exportConfig.workdir}/routesToCanvasExt.txt`, routesToCanvasExtCsvData, { encoding: 'utf-8', flush: true });

	Logger.info({ message: 'Exported routesToCanvasExt.txt file.' });

	return routeIds;
}
