/* * */

import { SQLiteDatabase } from '@tmlmobilidade/go-clients-sqlite';
import { type GtfsStrictV29ExtRoutes, type GtfsStrictV29ExtShapes, type GtfsStrictV29ExtStops, type GtfsStrictV29ExtStopTimes, type GtfsStrictV29ExtTrips } from '@tmlmobilidade/go-types-gtfs-strict';
import { type OperationalDateInt } from '@tmlmobilidade/go-types-shared';

import { type GtfsStrictV29ExtSQLTables } from './types.js';

/**
 * Initializes GTFS Strict v29 Ext SQL tables and writers.
 * @returns The initialized GTFS Strict v29 Ext SQL tables.
 */
export function initGtfsStrictV29ExtSqlTables(): GtfsStrictV29ExtSQLTables {
	//

	const calendarDatesMap: Record<string, OperationalDateInt[]> = {};

	const database = new SQLiteDatabase();

	const tripsTable = database.registerTable<GtfsStrictV29ExtTrips>('trips', {
		batch_size: 10000,
		columns: [
			{ indexed: true, name: 'trip_id', not_null: true, primary_key: true, type: 'TEXT' },
			{ indexed: false, name: 'bikes_allowed', type: 'TEXT' },
			{ indexed: false, name: 'block_id', type: 'TEXT' },
			{ indexed: false, name: 'direction_id', not_null: true, type: 'TEXT' },
			{ indexed: true, name: 'pattern_id', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'route_id', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'service_id', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'shape_id', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'trip_headsign', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'wheelchair_accessible', type: 'TEXT' },
		],
	});

	const routesTable = database.registerTable<GtfsStrictV29ExtRoutes>('routes', {
		batch_size: 10000,
		columns: [
			{ indexed: false, name: 'agency_id', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'continuous_drop_off', type: 'TEXT' },
			{ indexed: false, name: 'continuous_pickup', type: 'TEXT' },
			{ indexed: false, name: 'route_color', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'route_desc', type: 'TEXT' },
			{ indexed: true, name: 'route_id', not_null: true, primary_key: true, type: 'TEXT' },
			{ indexed: false, name: 'route_long_name', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'route_short_name', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'route_text_color', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'route_type', not_null: true, type: 'TEXT' },
		],
	});

	const shapesTable = database.registerTable<GtfsStrictV29ExtShapes>('shapes', {
		batch_size: 100000,
		columns: [
			{ indexed: true, name: 'shape_id', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'shape_pt_lat', not_null: true, type: 'REAL' },
			{ indexed: false, name: 'shape_pt_lon', not_null: true, type: 'REAL' },
			{ indexed: false, name: 'shape_pt_sequence', not_null: true, type: 'INTEGER' },
			{ indexed: false, name: 'shape_dist_traveled', not_null: true, type: 'REAL' },
		],
	});

	const stopsTable = database.registerTable<GtfsStrictV29ExtStops>('stops', {
		batch_size: 10000,
		columns: [
			{ indexed: false, name: 'location_type', type: 'TEXT' },
			{ indexed: false, name: 'parent_station', type: 'TEXT' },
			{ indexed: false, name: 'platform_code', type: 'TEXT' },
			{ indexed: false, name: 'stop_code', type: 'TEXT' },
			{ indexed: true, name: 'stop_id', not_null: true, primary_key: true, type: 'TEXT' },
			{ indexed: false, name: 'stop_lat', not_null: true, type: 'REAL' },
			{ indexed: false, name: 'stop_lon', not_null: true, type: 'REAL' },
			{ indexed: false, name: 'stop_name', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'wheelchair_boarding', type: 'TEXT' },
			// { indexed: false, name: 'lifecycle_status', type: 'TEXT' },
			// { indexed: false, name: 'stop_short_name', type: 'TEXT' },
			// { indexed: false, name: 'tts_stop_name', type: 'TEXT' },
			// { indexed: false, name: 'district_id', type: 'TEXT' },
			// { indexed: false, name: 'district_name', type: 'TEXT' },
			// { indexed: false, name: 'flags', type: 'TEXT' },
			// { indexed: false, name: 'legacy_ids', type: 'TEXT' },
			// { indexed: false, name: 'municipality_id', type: 'TEXT' },
			// { indexed: false, name: 'municipality_name', type: 'TEXT' },
			// { indexed: false, name: 'parish_id', type: 'TEXT' },
			// { indexed: false, name: 'parish_name', type: 'TEXT' },
			// { indexed: false, name: 'locality_id', type: 'TEXT' },
			// { indexed: false, name: 'locality_name', type: 'TEXT' },
		],
	});

	const stopTimesTable = database.registerTable<GtfsStrictV29ExtStopTimes>('stop_times', {
		batch_size: 100000,
		columns: [
			{ indexed: false, name: 'arrival_time', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'departure_time', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'drop_off_type', type: 'TEXT' },
			{ indexed: false, name: 'pickup_type', type: 'TEXT' },
			{ indexed: false, name: 'shape_dist_traveled', not_null: true, type: 'REAL' },
			{ indexed: true, name: 'stop_id', not_null: true, type: 'TEXT' },
			{ indexed: true, name: 'trip_id', not_null: true, type: 'TEXT' },
			{ indexed: false, name: 'stop_sequence', not_null: true, type: 'INTEGER' },
			{ indexed: false, name: 'timepoint', type: 'TEXT' },
		],
	});

	return {
		_db: database,
		calendar_dates: calendarDatesMap,
		routes: routesTable,
		shapes: shapesTable,
		stop_times: stopTimesTable,
		stops: stopsTable,
		trips: tripsTable,
	};
}
