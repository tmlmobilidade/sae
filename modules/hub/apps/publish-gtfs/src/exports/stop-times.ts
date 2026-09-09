/* * */

import { getQualifiedTripId } from '@tmlmobilidade/go-hub-pckg-utils';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type GtfsStopTimes } from '@tmlmobilidade/go-types-gtfs';
import { type HubV1GtfsStopTimesInput, HubV1GtfsStopTimesSchema } from '@tmlmobilidade/go-types-hub';
import { type StopId } from '@tmlmobilidade/go-types-infrastructure';
import { type Plan } from '@tmlmobilidade/go-types-operation';
import { type GtfsSQLTables } from '@tmlmobilidade/import-gtfs';
import { Logger } from '@tmlmobilidade/logger';

import { type ExportGtfsContext } from '../types/context.js';

/**
 * Export the stop_times.txt file.
 * @param planData The plan data.
 * @param sqlTables The SQL tables.
 * @param context The export context.
 */
export async function exportStopTimesFile(context: ExportGtfsContext, planData: Plan, sqlTables: GtfsSQLTables) {
	//

	//
	// Fetch all stops for the current agency
	// and build a map of flag IDs to stop_id

	const allStopsData = await goDb.infrastructure.stops.findMany({ 'flags.agency_ids': { $in: [planData.agency_id] } });

	const allStopsMap = new Map<string, StopId>();

	allStopsData.forEach((stopData) => {
		allStopsMap.set(stopData._id, stopData._id);
		stopData.flags?.forEach((flag) => {
			if (flag.agency_ids?.includes(planData.agency_id)) {
				allStopsMap.set(flag.stop_id, stopData._id);
			}
		});
		stopData.legacy_ids?.forEach((legacyId) => {
			allStopsMap.set(legacyId, stopData._id);
		});
	});

	for await (const stopTimeItem of sqlTables.stop_times.stream('ORDER BY trip_id, stop_sequence ASC')) {
		try {
			const stopTimeData: GtfsStopTimes = stopTimeItem;
			let matchingStopId = allStopsMap.get(stopTimeData.stop_id);
			if (!matchingStopId) {
				const foundMissingStopData = await goDb.infrastructure.stops.findById(stopTimeData.stop_id);
				if (!foundMissingStopData) throw new Error(`Stop time ${stopTimeData.stop_id} not found in stops map for agency ${planData.agency_id}`);
				matchingStopId = foundMissingStopData._id;
			}
			const parsedStopTimesRow: HubV1GtfsStopTimesInput = {
				arrival_time: stopTimeData.arrival_time,
				continuous_drop_off: '0',
				continuous_pickup: '0',
				departure_time: stopTimeData.departure_time,
				drop_off_type: stopTimeData.drop_off_type ?? '0',
				pickup_type: stopTimeData.pickup_type ?? '0',
				shape_dist_traveled: stopTimeData.shape_dist_traveled ?? 0,
				stop_id: matchingStopId,
				stop_sequence: stopTimeData.stop_sequence,
				timepoint: stopTimeData.timepoint ?? '0',
				trip_id: getQualifiedTripId(planData._id, planData.agency_id, stopTimeData.trip_id),
			};
			const validatedStopTimesRow = HubV1GtfsStopTimesSchema.parse(parsedStopTimesRow);
			await context.writers.stop_times.write(validatedStopTimesRow);
		} catch (error) {
			console.error(stopTimeItem);
			throw error;
		}
	}

	await context.writers.stop_times.flush();

	Logger.info({ message: 'Exported stop_times.txt file.' });
}
