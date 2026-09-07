/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { setPlanStatus } from '@tmlmobilidade/go-operation-pckg-utils';
import { storageProvider } from '@tmlmobilidade/go-providers-storage';
import { type HashedShape, type HashedTrip, type Plan, type RideWithAnalyses } from '@tmlmobilidade/go-types-operation';
import { HexColorSchema, NonNegativeIntegerSchema, OperationalDateIntSchema } from '@tmlmobilidade/go-types-shared';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { BatchWriter, startHeartbeat } from '@tmlmobilidade/go-utils-exec';
import { type ImportGtfsConfig, importGtfsStrictV30ToDatabase } from '@tmlmobilidade/import-gtfs';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';
import { fromOperationalTimeAndOperationalDateToUnixMilliseconds } from '@tmlmobilidade/utils';

import { cleanupOrphanRidesForPlan } from '../utils/cleanup.js';
import { toHashedShape } from '../utils/to-hashed-shape.js';
import { toHashedTrip } from '../utils/to-hashed-trip.js';

/* * */

const ridesWriter = new BatchWriter<RideWithAnalyses>({
	batch_size: 10_000,
	insertFn: async (data) => {
		await goDb.operation.rides.insertMany(data);
	},
	title: (await goDb.operation.rides.getCollection()).collectionName,
});

const hashedShapesWriter = new BatchWriter<HashedShape>({
	batch_size: 2_000,
	insertFn: async (data) => {
		await labDb.operation.hashedShapes.insert('JSONEachRow', data);
	},
	title: await labDb.operation.hashedShapes.getTableName(),
});

const hashedTripsWriter = new BatchWriter<HashedTrip>({
	batch_size: 10_000,
	insertFn: async (data) => {
		await labDb.operation.hashedTrips.insert('JSONEachRow', data);
	},
	title: await labDb.operation.hashedTrips.getTableName(),
});

/* * */

export async function parsePlanTask(planData: Plan) {
	//

	const globalTimer = new Timer();

	Logger.spacer(1);
	Logger.divider(`Agency ${planData.agency_id} - Plan ${planData._id}`);

	//
	// Mark the plan as 'error' if it does not have an associated operation file

	if (!planData.attachments.operation_gtfs_normalized) {
		console.error(`Skip processing: No operation GTFS normalized found. (plan: ${planData._id})`);
		await setPlanStatus(planData._id, 'rides_feeder', 'error');
		return;
	}

	//
	// Fetch the agency data from the database

	const agencyData = await goDb.core.agencies.findById(planData.agency_id);

	if (!agencyData) {
		Logger.error({ message: `Agency not found: ${planData.agency_id}` });
		await setPlanStatus(planData._id, 'rides_feeder', 'error');
		return;
	}

	//
	// Start a heartbeat to indicate the plan is still being processed.

	const heartbeat = startHeartbeat({
		intervalMs: 30_000,
		runFn: async () => await setPlanStatus(planData._id, 'rides_feeder', 'processing'),
	});

	Logger.success(`Processing started: feed_start_date: ${planData.active_from} | feed_end_date: ${planData.active_until}`);
	Logger.spacer(1);

	try {
		//

		//
		// Import the GTFS into SQLite using the helper package

		const importTimer = new Timer();

		const operationFileUrl = await storageProvider.getSignedUrl({ fileId: planData.attachments.operation_gtfs_normalized });

		const importConfig: ImportGtfsConfig = {
			source: {
				url: operationFileUrl,
			},
			sqlite_config: {
				memory: true,
			},
			time_range: {
				date_range: {
					end: planData.active_until,
					start: planData.active_from,
				},
			},
		};

		const importedGtfsSql = await importGtfsStrictV30ToDatabase(importConfig);

		Logger.success(`Imported Plan ${planData._id} in ${importTimer.get()}.`);

		//
		// Setup variables to save formatted entities found in this Plan

		const processedShapeIds = new Map<string, HashedShape>();
		const processedTripIds = new Map<string, HashedTrip[]>();

		const savedRideIds = new Set<string>();
		const savedHashedTripIds = new Set<string>();
		const savedHashedShapeIds = new Set<string>();

		/* * */
		/* OUTPUT FILES */

		try {
			//

			const outputsTimer = new Timer();

			Logger.title(`Generating Rides and HashedTrips...`);

			Logger.info({ message: `calendar_dates: ${Object.values(importedGtfsSql.calendar_dates).flat().length} days for ${Object.keys(importedGtfsSql.calendar_dates).length} service IDs` });
			Logger.info({ message: `trips: ${importedGtfsSql.trips.size} rows` });
			Logger.info({ message: `routes: ${importedGtfsSql.routes.size} rows` });
			Logger.info({ message: `shapes: ${importedGtfsSql.shapes.size} rows` });
			Logger.info({ message: `stops: ${importedGtfsSql.stops.size} rows` });
			Logger.info({ message: `stop_times: ${importedGtfsSql.stop_times.size} rows` });

			let tripsCounter = importedGtfsSql.trips.size;
			let stopTimesCounter = importedGtfsSql.stop_times.size;

			for (const currentTrip of importedGtfsSql.trips.all()) {
				//

				//
				// Log every 10_000 rides processed

				if (tripsCounter % 10_000 === 0) Logger.title(`${tripsCounter} trips left. ${stopTimesCounter} stop_times left. Generated ${savedRideIds.size} Rides so far. `);

				//
				// Get associated data from previously saved entities,
				// as well as other commonly used variables in the next steps.

				const calendarDatesData = importedGtfsSql.calendar_dates[currentTrip.service_id];
				const routeData = importedGtfsSql.routes.get('route_id', currentTrip.route_id);
				const shapeData = importedGtfsSql.shapes.all('WHERE shape_id = ?', [currentTrip.shape_id]);
				const stopTimesData = importedGtfsSql.stop_times.all('WHERE trip_id = ? ORDER BY stop_sequence ASC', [currentTrip.trip_id]);
				const stopsData = importedGtfsSql.stops.all('WHERE stop_id IN (SELECT DISTINCT stop_id FROM stop_times WHERE trip_id = ?)', [currentTrip.trip_id]);

				//
				// Validate the required data for this trip
				// to prevent errors later on.

				if (!calendarDatesData || calendarDatesData.length === 0) {
					Logger.error({ message: `Trip "${currentTrip.trip_id}" has no calendar dates. Skipping...` });
					continue;
				}

				if (!routeData) {
					Logger.error({ message: `Trip "${currentTrip.trip_id}" has no route data. Skipping...` });
					continue;
				}

				if (!shapeData || shapeData.length === 0) {
					Logger.error({ message: `Trip "${currentTrip.trip_id}" has no shape data. Skipping...` });
					continue;
				}

				if (!stopTimesData || stopTimesData.length === 0) {
					Logger.error({ message: `Trip "${currentTrip.trip_id}" has no stop_times data. Skipping...` });
					continue;
				}

				if (!stopsData || stopsData.length === 0) {
					Logger.error({ message: `Trip "${currentTrip.trip_id}" has no stops data. Skipping...` });
					continue;
				}

				/* * */
				/* HASHED SHAPE */

				//
				// If this shape has been processed already, skip it.
				// Otherwise, transform the shape data into a HashedShape
				// and save it to the database.

				if (!processedShapeIds.has(currentTrip.shape_id)) {
					const hashedShapeItem = toHashedShape(planData, currentTrip, shapeData);
					await hashedShapesWriter.write(hashedShapeItem);
					savedHashedShapeIds.add(hashedShapeItem._id);
					processedShapeIds.set(currentTrip.shape_id, hashedShapeItem);
				}

				const uniqueIdValueForHashedShape = processedShapeIds.get(currentTrip.shape_id)?._id;
				const extensionScheduledInMeters = processedShapeIds.get(currentTrip.shape_id)?.extension;

				/* * */
				/* HASHED TRIP */

				//
				// If this trip has been processed already, skip it.
				// Otherwise, transform the trip data into a HashedTrip and save it to the database.
				// HashedTrip items are harder to keep track of because they change more often, and in plans
				// with individual trips per operational day, the amount of data would quickly become too large
				// to fit in memory. Hoewver, shape_id + start time are a good enough unique identifier for the trip
				// when inside the plan, so we can use that to identify the hashed trip during the parsing process.

				const keyForHashedTrip = `${currentTrip.shape_id}-${stopTimesData[0].arrival_time}`;

				if (!processedTripIds.has(keyForHashedTrip)) {
					const hashedTripItems = toHashedTrip(planData, currentTrip, stopTimesData, stopsData);
					await hashedTripsWriter.write(hashedTripItems);
					savedHashedTripIds.add(hashedTripItems[0]._id);
					processedTripIds.set(keyForHashedTrip, hashedTripItems);
				}

				const uniqueIdValueForHashedTrip = processedTripIds.get(keyForHashedTrip)?.[0]._id;

				/* * */
				/* RIDES */

				//
				// Iterate on the saved calendar dates for this trip,
				// and create a Ride document for each date.

				for (const calendarDate of calendarDatesData) {
					//

					//
					// Setup the required variables for the Ride document.

					const uniqueIdValueForRide = `${planData._id}-${routeData.agency_id}-${calendarDate}-${currentTrip.trip_id}`;

					const startTimeScheduledString = stopTimesData[0].arrival_time;
					const startTimeScheduledUnixMilliseconds = fromOperationalTimeAndOperationalDateToUnixMilliseconds(startTimeScheduledString, calendarDate);

					const endTimeScheduledString = stopTimesData[stopTimesData.length - 1].arrival_time;
					const endTimeScheduledUnixMilliseconds = fromOperationalTimeAndOperationalDateToUnixMilliseconds(endTimeScheduledString, calendarDate);

					//
					// Build the final Ride objects

					const finalRide: RideWithAnalyses = {
						_id: uniqueIdValueForRide,
						agency_code: agencyData.code,
						agency_id: planData.agency_id,
						analyses: null,
						apex_banking_taps_amount: null,
						apex_banking_taps_qty: null,
						apex_locations_qty: null,
						apex_refunds_amount: null,
						apex_refunds_qty: null,
						apex_sales_amount: null,
						apex_sales_qty: null,
						apex_validations_qty: null,
						direction_id: currentTrip.direction_id,
						driver_ids: [],
						end_time_observed: null,
						end_time_scheduled: endTimeScheduledUnixMilliseconds,
						extension_observed: null,
						extension_scheduled: NonNegativeIntegerSchema.parse(Math.round(extensionScheduledInMeters)),
						hashed_shape_id: uniqueIdValueForHashedShape,
						hashed_trip_id: uniqueIdValueForHashedTrip,
						headsign: currentTrip.trip_headsign,
						operational_date: OperationalDateIntSchema.parse(calendarDate),
						passengers_estimated: null,
						passengers_observed: null,
						passengers_observed_banking_taps_amount: null,
						passengers_observed_banking_taps_qty: null,
						passengers_observed_prepaid_amount: null,
						passengers_observed_prepaid_qty: null,
						passengers_observed_sales_amount: null,
						passengers_observed_sales_qty: null,
						passengers_observed_subscription_qty: null,
						plan_id: planData._id,
						processing_status: 'waiting',
						route_color: HexColorSchema.parse(routeData.route_color),
						route_id: routeData.route_id,
						route_long_name: routeData.route_long_name,
						route_short_name: routeData.route_short_name,
						route_text_color: HexColorSchema.parse(routeData.route_text_color),
						seen_first_at: null,
						seen_last_at: null,
						shape_id: currentTrip.shape_id,
						start_time_observed: null,
						start_time_scheduled: startTimeScheduledUnixMilliseconds,
						timezone: agencyData.timezone,
						trip_id: currentTrip.trip_id,
						updated_at: Dates.now('utc').unix_milliseconds,
						vehicle_ids: [],
					};

					//
					// Save this Ride document to the database using the
					// BatchWriter, and store the ID for later reference.

					await ridesWriter.write(finalRide);

					savedRideIds.add(finalRide._id);
				}

				//
				// Decrement the trips and stop times counters
				// to keep track of progress in the logs

				tripsCounter--;
				stopTimesCounter--;
			}

			//
			// Flush the writers to save all the data to the database
			// before changing the Plan status to 'success'.

			await hashedShapesWriter.flush();
			await hashedTripsWriter.flush();
			await ridesWriter.flush();

			//
			// Cleanup the saved entities to avoid
			// storing so much data on disk.

			importedGtfsSql._db.cleanup();

			//
			// Log progress

			Logger.info({ message: `Saved ${savedRideIds.size} Rides and ${savedHashedTripIds.size} HashedTrips in ${outputsTimer.get()}.` });

			//
		} catch (error) {
			Logger.error({ error, message: `Error transforming or saving Shapes, Trips or Rides to database: ${error.message}` });
			throw error;
		}

		//
		// Cleanup Rides that are no longer valid for this Plan.

		await cleanupOrphanRidesForPlan(planData._id, savedRideIds);

		//
		// Mark this plan as 'complete' to indicate that it was processed successfully

		heartbeat.stop();

		await setPlanStatus(planData._id, 'rides_feeder', 'complete', planData.hash);

		Logger.success(`Finished processing plan "${planData._id}". (${globalTimer.get()})`);

		//
	} catch (error) {
		await setPlanStatus(planData._id, 'rides_feeder', 'error');
		throw error;
	} finally {
		heartbeat.stop();
	}
};
