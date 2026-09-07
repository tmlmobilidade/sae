import { exportAgencyFile } from '@/exports/agency.js';
import { exportCalendarFiles } from '@/exports/calendars.js';
import { exportDayTypesFile } from '@/exports/day_types.js';
import { exportRoutesFile } from '@/exports/routes.js';
import { exportStopTimesFile } from '@/exports/stop-times.js';
import { exportStopsFile } from '@/exports/stops.js';
import { exportTripsFile } from '@/exports/trips.js';
import { type ExportToHitouchConfig } from '@/types.js';
import { buildDatesMap } from '@/utils/build-dates-map.js';
import { createHitouchZip } from '@/utils/create-hitouch-zip.js';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { storageProvider } from '@tmlmobilidade/go-providers-storage';
import { type PlanPostersContentMode, type PlanPostersFilterMode } from '@tmlmobilidade/go-types-downloads';
import { type LinesMode } from '@tmlmobilidade/go-types-offer';
import { type Plan } from '@tmlmobilidade/go-types-operation';
import { validateOperationalDate } from '@tmlmobilidade/go-types-shared';
import { type ImportGtfsConfig, importGtfsStrictV29ExtToDatabase } from '@tmlmobilidade/import-gtfs';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';
import fs from 'node:fs';

/* * */

export async function importPlanToSqlite(planData: Plan, options?: { canvas_profile?: ExportToHitouchConfig['canvas_profile'], content_mode?: PlanPostersContentMode, line_codes?: string[], lines_mode?: LinesMode, stop_ids?: string[], stops_mode?: PlanPostersFilterMode, workdir?: string }): Promise<ExportToHitouchConfig> {
	//

	//
	// Import the Plan into a local SQLite database

	const operationFileUrl = await storageProvider.getSignedUrl({ fileId: planData.operation_file_id });
	const feedStartDate = planData.gtfs_feed_info.feed_start_date;
	const feedEndDate = planData.gtfs_feed_info.feed_end_date;
	const agencyId = planData.gtfs_agency.agency_id;

	//
	// Check if the feed start and end dates are valid

	if (!feedStartDate || !feedEndDate) {
		throw new Error(`Plan ${planData._id} is missing feed start or end dates.`);
	}

	//
	// Import the GTFS feed into a local SQLite database

	const importConfig: ImportGtfsConfig = {
		source: {
			url: operationFileUrl,
		},
		time_range: {
			date_range: {
				end: feedEndDate,
				start: feedStartDate,
			},
		},
	};

	//
	// Import the GTFS feed into a local SQLite database

	const sqlGtfs = await importGtfsStrictV29ExtToDatabase(importConfig);

	// Line filtering is temporarily disabled while PDF exports use stop filters only.
	// if (options?.content_mode === 'lines' && options.line_codes?.length) {
	// 	const lineIdMatchExpression = options.line_codes
	// 		.map(() => '(CAST(line_id AS TEXT) = ? OR CAST(line_id AS TEXT) GLOB ?)')
	// 		.join(' OR ');
	// 	const lineIdMatchParameters = options.line_codes.flatMap(lineCode => [lineCode, `${lineCode}_*`]);
	// 	const matchingRoutes = sqlGtfs.routes.all(`WHERE ${lineIdMatchExpression}`, lineIdMatchParameters);
	// 	if (!matchingRoutes.length) {
	// 		throw new Error(`None of the selected lines exist in Plan ${planData._id}.`);
	// 	}
	// 	const matchingRouteLineIds = matchingRoutes.map(route => String(route.line_id));
	// 	const missingLineCodes = options.line_codes.filter(lineCode => !matchingRouteLineIds.some(routeLineId => routeLineId === lineCode || routeLineId.startsWith(`${lineCode}_`)));
	// 	if (missingLineCodes.length) {
	// 		throw new Error(`Lines ${missingLineCodes.join(', ')} do not exist in Plan ${planData._id}.`);
	// 	}
	// 	const selectedRoutes = options.lines_mode === 'exclude'
	// 		? sqlGtfs.routes.all(`WHERE NOT (${lineIdMatchExpression})`, lineIdMatchParameters)
	// 		: matchingRoutes;
	// 	if (!selectedRoutes.length) {
	// 		throw new Error(`The selected line filter removes every route from Plan ${planData._id}.`);
	// 	}
	// }

	if (options?.content_mode === 'stops' && options.stop_ids?.length) {
		const stopPlaceholders = options.stop_ids.map(() => '?').join(', ');
		const matchingStopIds = sqlGtfs.stop_times
			.all(`WHERE stop_id IN (${stopPlaceholders})`, options.stop_ids)
			.map(stopTime => stopTime.stop_id);
		const matchingStopIdSet = new Set(matchingStopIds);
		const missingStopIds = options.stop_ids.filter(stopId => !matchingStopIdSet.has(stopId));

		if (missingStopIds.length) {
			throw new Error(`Stops ${missingStopIds.join(', ')} do not exist in Plan ${planData._id}.`);
		}
	}

	const sourceHasCalendar = true;
	const [agencyHolidays, agencyYearPeriods] = await Promise.all([
		goDb.offer.holidays.findMany({ agency_ids: { $in: [agencyId] } }),
		goDb.offer.yearPeriods.findMany({ agency_ids: { $in: [agencyId] } }),
	]);

	//
	// Setup the export config

	const exportConfig: ExportToHitouchConfig = {
		canvas_profile: options?.canvas_profile ?? '0Master.C',
		content_mode: options?.content_mode ?? 'all',
		date_range: {
			end: validateOperationalDate(feedEndDate),
			start: validateOperationalDate(feedStartDate),
		},
		line_codes: options?.line_codes ?? [],
		lines_mode: options?.content_mode === 'lines' ? options.lines_mode ?? 'include' : undefined,
		output: options?.workdir ? `${planData._id}-hitouch-posters.zip` : `../${planData._id}-hitouch-posters.zip`,
		source_has_calendar: sourceHasCalendar,
		stop_ids: options?.stop_ids ?? [],
		stops_mode: options?.content_mode === 'stops' ? options.stops_mode ?? 'include' : undefined,
		workdir: options?.workdir ?? `/tmp/hitouch/${planData._id}`,
	};

	if (fs.existsSync(exportConfig.workdir)) {
		fs.rmSync(exportConfig.workdir, { recursive: true });
	}
	fs.mkdirSync(exportConfig.workdir, { recursive: true });

	//
	// Export the files required by the API

	Logger.info({ message: `Exporting Plan ${planData._id} to HiTouch GTFS...` });

	const exportTimer = new Timer();

	const datesMap = buildDatesMap(exportConfig.date_range, agencyHolidays, agencyYearPeriods);

	await exportCalendarFiles(sqlGtfs, exportConfig, datesMap);
	await exportTripsFile(sqlGtfs, exportConfig);
	await exportStopTimesFile(sqlGtfs, exportConfig);
	await exportRoutesFile(sqlGtfs, exportConfig);
	await exportStopsFile(sqlGtfs, exportConfig);
	await exportAgencyFile(planData, exportConfig);
	// await exportFeedInfoFile(exportConfig); // feed_info.txt is intentionally excluded because ZPHERES Studio does not support it.
	await exportDayTypesFile(exportConfig);

	Logger.info({ message: `Exported files in ${exportTimer.get()} seconds` });

	//
	// Package all exported TXT files into the ZIP archive

	const zipTimer = new Timer();
	const outputPath = await createHitouchZip(exportConfig);
	const outputSize = fs.statSync(outputPath).size;

	Logger.info({ message: `Created ${outputPath} (${outputSize} bytes) in ${zipTimer.get()} seconds` });

	return exportConfig;
}
