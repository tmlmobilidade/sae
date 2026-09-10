/* * */

import { pipelinePath } from '@tmlmobilidade/go-eta-pckg-common';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { performInTimeChunks } from '@tmlmobilidade/go-utils-exec';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { aggregateHistNodeTravelTimes } from './process/aggregate-hist-node-travel-times.js';
import { buildHistNodeTravelTimes } from './process/build-hist-node-travel-times.js';
import { loadHistoricalShapeNodes } from './process/load-historical-shape-nodes.js';
import { AppConfig } from './types/config.js';

/* * */

/**
 * Loads the ETA data into clickhouse
 *
 * @param config - The configuration for the loader.
 * @returns A promise that resolves when the data is loaded.
 */
export async function loadEta(config: AppConfig) {
	//
	// Initialize the logger

	Logger.init();
	const globalTimer = new Timer();

	//
	// 1. Bootstrap
	if (config.stages._1_bootstrap) {
		Logger.title('1. Bootstrapping ETA');

		await labDb.queryEachStatementFromFile(pipelinePath('bootstrap/create-tables.sql'));
		Logger.progress({ message: 'Created base tables' });

		await labDb.queryEachStatementFromFile(pipelinePath('bootstrap/mv-sync-curr-vehicle-events.sql'));
		Logger.progress({ message: 'Created MV: mv-sync-curr-vehicle-events' });

		await labDb.queryEachStatementFromFile(pipelinePath('bootstrap/mv-predict-node-etas.sql'));
		Logger.progress({ message: 'Created MV: mv-predict-node-etas' });

		await labDb.queryEachStatementFromFile(pipelinePath('bootstrap/mv-predict-trip-stop-etas.sql'));
		Logger.progress({ message: 'Created MV: mv-predict-trip-stop-etas' });
	}

	//
	// 2. Load current rides

	if (config.stages._2_loadCurrentRides) {
		Logger.title('2. Loading current rides');
		await labDb.queryFromFile(pipelinePath('loader/load-rides.sql'), {
			agency_ids: config.agencyIds.join(','),
			line_ids: undefined,
			table_name: 'curr_rides',
			time_end: config.processing.currentRidesEndTime,
			time_start: config.processing.currentRidesStartTime,
		});

		Logger.progress({ message: 'Loaded current rides: curr_rides' });
	}

	//
	// 3. Load historical rides

	if (config.stages._3_loadHistoricalRides) {
		Logger.title('3. Loading historical rides');
		await labDb.queryFromFile(pipelinePath('loader/load-rides.sql'), {
			agency_ids: config.agencyIds.join(','),
			line_ids: undefined,
			table_name: 'hist_rides',
			time_end: config.processing.historicalRidesEndTime,
			time_start: config.processing.historicalRidesStartTime,
		});

		// Delete where analysis_expected_vehicle_event_coverage_geo_grade != 'pass'
		await labDb.command({
			query: `DELETE FROM eta.hist_rides WHERE ifNull(analysis_expected_vehicle_event_coverage_geo_grade, '') != 'pass'`,
		});

		Logger.progress({ message: 'Loaded historical rides: hist_rides' });
	}

	//
	// 4. Load historical shape nodes
	if (config.stages._4_loadHistoricalShapeNodes) {
		Logger.title('4. Loading historical shape nodes');
		await loadHistoricalShapeNodes(config.processing.shapeNodeChunkLength, config.processing.geohashPrefixLength);
		Logger.progress({ message: 'Loaded historical shape nodes: hist_shape_nodes' });
	}

	//
	// 5. Load historical vehicle events

	if (config.stages._5_loadHistoricalVehicleEvents) {
		Logger.title('5. Loading historical vehicle events');
		await performInTimeChunks({
			endDate: config.processing.historicalRidesEndTime,
			intervalHrs: 24,
			onChunk: async (chunk) => {
				Logger.progress({ message: `[${chunk.index + 1}/${chunk.total}] historical vehicle events` });
				await labDb.queryFromFile(pipelinePath('loader/load-historical-vehicle-events.sql'), {
					chunk_end: chunk.end,
					chunk_start: chunk.start,
				});
			},
			order: 'desc',
			startDate: config.processing.historicalRidesStartTime,
		});
	}

	if (config.stages._6_calculateNodeTravelTimes) {
		Logger.title('6. Run Node Travel Times Transformation & Aggregation');

		//
		// Calculate the node travel times for the historical rides
		Logger.info({ message: 'Running build_hist_node_travel_times.sql query in chunks' });
		await buildHistNodeTravelTimes(config.processing.historicalRidesStartTime, config.processing.historicalRidesEndTime);

		//
		// Aggregate the node travel times for the historical rides
		Logger.info({ message: 'Running aggregate_hist_node_travel_times.sql query in chunks' });
		await aggregateHistNodeTravelTimes(config.processing.historicalRidesStartTime, config.processing.historicalRidesEndTime);
	}

	if (config.stages._7_loadCurrentWaypoints) {
		Logger.title('7. Loading and snapping current waypoints');

		await labDb.queryFromFile(pipelinePath('loader/load-current-waypoints.sql'));
		Logger.progress({ message: 'Loaded current waypoints: curr_waypoints' });

		await labDb.queryFromFile(pipelinePath('loader/snap-waypoints.sql'));
		Logger.progress({ message: 'Snapped waypoints: curr_waypoints_snapped' });
	}

	Logger.success(`ETA loaded in ${globalTimer.get()}.`);
}
