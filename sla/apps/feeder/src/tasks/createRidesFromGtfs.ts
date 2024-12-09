/* * */

import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { MongoDbWriter } from '@helperkits/writer';
import { hashedShapes, hashedTrips, plans, rides } from '@tmlmobilidade/services/interfaces';
import { CreateHashedShapeDto, CreateHashedTripDto, createOperationalDate, CreateRideDto, HashedShapePoint, HashedTripWaypoint, OPERATIONAL_DATE_FORMAT, OperationalDate } from '@tmlmobilidade/services/types';
import crypto from 'crypto';
import { parse as csvParser } from 'csv-parse';
import extract from 'extract-zip';
import fs from 'fs';
import { DateTime } from 'luxon';

/* * */

export async function createRidesFromGtfs() {
	try {
		//

		LOGGER.init();

		const globalTimer = new TIMETRACKER();

		//
		// Setup database writer

		const hashedShapesCollection = await hashedShapes.getCollection();
		const hashedTripsCollection = await hashedTrips.getCollection();
		const ridesCollection = await rides.getCollection();

		const hashedTripsDbWritter = new MongoDbWriter('HashedTrip', hashedShapesCollection);
		const hashedShapesDbWritter = new MongoDbWriter('HashedShape', hashedTripsCollection);
		const ridesDbWritter = new MongoDbWriter('Rides', ridesCollection);

		//
		// Setup variables to keep track of created IDs

		const parsedPlanIds = new Set<string>();
		const savedHashedTripIds = new Set<string>();
		const savedHashedShapeIds = new Set<string>();

		//
		// Get all Plans and iterate on each one

		const allPlansData = await plans.all();

		LOGGER.info(`Found ${allPlansData.length} Plans to process...`);

		for (const [planIndex, planData] of allPlansData.entries()) {
			try {
				//

				//
				// Skip this plan if its feeder status is other than 'waiting'

				if (planData.feeder_status !== 'waiting') {
					LOGGER.error(`[${planIndex + 1}/${allPlansData.length}] Skipping Plan ${planData._id} | Plan feeder_status is '${planData.feeder_status}'. Only 'waiting' plans will be processed.`);
					continue;
				}

				//
				// Skip this plan if it is not yet approved

				if (!planData.is_approved) {
					LOGGER.error(`[${planIndex + 1}/${allPlansData.length}] Skipping Plan ${planData._id} | Plan is not approved.`);
					continue;
				}

				//
				// Skip this plan if it does not have an associated operation file

				if (!planData.operation_file) {
					LOGGER.error(`[${planIndex + 1}/${allPlansData.length}] Skipping Plan ${planData._id} | No operation file found.`);
					continue;
				}

				//
				// At this point, the plan will be processed.
				// Mark it as 'processing' to prevent multiple concurrent runs.

				await plans.updateById(planData._id, { feeder_status: 'processing' });

				LOGGER.divider();
				LOGGER.info(`[${planIndex + 1}/${allPlansData.length}] Processing Plan ${planData._id} | valid_from: ${planData.valid_from} | valid_until: ${planData.valid_until}`);

				//
				// Setup variables to save formatted entities found in this Plan

				const savedRideIds = new Set<string>();

				const referencedStopIds = new Set<string>();
				const referencedShapeIds = new Set<string>();
				const referencedRouteIds = new Set<string>();

				const savedCalendarDates = new Map<string, OperationalDate[]>();
				const savedTrips = new Map();
				const savedStops = new Map();
				const savedRoutes = new Map();
				const savedShapes = new Map<string, HashedShapePoint[]>();
				const savedStopTimes = new Map<string, HashedTripWaypoint[]>();

				//
				// Prepare the working directories for the current plan

				const downloadUrl = `${process.env.GO_API_HOST}/api/media/${planData.operation_file}/download_public`;
				const workdirPath = `/tmp/sae-feeder/${planData._id}`;
				const downloadFilePath = `${workdirPath}/${planData.operation_file}.zip`;
				const extractDirPath = `${workdirPath}/extracted`;

				if (fs.existsSync(workdirPath)) {
					fs.rmSync(workdirPath, { force: true, recursive: true });
				}

				fs.mkdirSync(workdirPath, { recursive: true });

				//
				// Download and unzip the associated operation file

				const planFileData = await fetch(downloadUrl).then(response => response.blob());
				const planFileBuffer = await planFileData.arrayBuffer();

				fs.writeFileSync(downloadFilePath, Buffer.from(planFileBuffer));

				await unzipFile(downloadFilePath, extractDirPath);

				//
				// The order of execution matters when parsing each file. This is because plans are valid on a set of dates.
				// By first parsing calendar_dates.txt, we know exactly which service_ids "were active" in the set of dates.
				// Then, when parsing trips.txt, only trips that belong to those service_ids will be included. And so on, for each file.
				// By having a list of trips we can extract only the necessary info from the other files, and thus reducing significantly
				// the amount of information to be checked.

				//
				// Extract calendar_dates.txt and filter only service_ids valid between the given plan start_date and end_date.

				try {
					//

					LOGGER.info(`Reading zip entry "calendar_dates.txt" of plan "${planData._id}"...`);

					//
					// Parse each row, and save only the matching servic_ids

					const parseEachRow = async (data) => {
						//

						//
						// Validate the date to ensure it is of type OperationalDate

						let currentOperationalDate: OperationalDate;

						try {
							currentOperationalDate = createOperationalDate(data.date);
						}
						catch (error) {
							LOGGER.error(`Error creating operational date "${data.date}" for service_id "${data.service_id}" of plan ${planData._id}`, error);
							return;
						}

						//
						// Skip if this row's date is before the plan's start date or after the plan's end date

						if (currentOperationalDate < planData.valid_from || currentOperationalDate > planData.valid_until) return;

						//
						// Get the previously saved calendar

						const savedCalendar = savedCalendarDates.get(data.service_id);

						if (savedCalendar) {
							// If this service_id was previously saved, add the current date to it
							savedCalendarDates.set(data.service_id, Array.from(new Set([currentOperationalDate, ...savedCalendar])));
						}
						else {
							// If this is the first time we're seeing this service_id, initiate the dates array with the current date
							savedCalendarDates.set(data.service_id, [currentOperationalDate]);
						}
						//
					};

					//
					// Setup the CSV parsing operation

					await parseCsvFile(`${extractDirPath}/calendar_dates.txt`, parseEachRow);

					LOGGER.success(`Finished processing "calendar_dates.txt" of plan "${planData._id}"`);

					//
				}
				catch (error) {
					LOGGER.error('Error processing "calendar_dates.txt" file.', error);
					throw new Error('✖︎ Error processing "calendar_dates.txt" file.');
				}

				//
				// Next up: trips.txt
				// Now that the calendars are sorted out, the jobs is easier for the trips.
				// Only include trips which have the referenced service IDs saved before.

				try {
					//

					LOGGER.info(`Reading zip entry "trips.txt" of plan "${planData._id}"...`);

					//
					// For each trip, check if the associated service_id was saved in the previous step or not.
					// Include it if yes, skip otherwise.

					const parseEachRow = async (data) => {
						//

						//
						// Skip if this row's service_id was not saved before
						if (!savedCalendarDates.has(data.service_id)) return;

						//
						// Format the exported row. Only include the minimum required to prevent memory bloat later on.

						const parsedRowData = {
							pattern_id: data.pattern_id,
							route_id: data.route_id,
							service_id: data.service_id,
							shape_id: data.shape_id,
							trip_headsign: data.trip_headsign,
							trip_id: data.trip_id,
						};

						//
						// Save this trip for later

						savedTrips.set(data.trip_id, parsedRowData);

						//
						// Reference the route_id and shape_id to filter them later
						referencedRouteIds.add(data.route_id);
						referencedShapeIds.add(data.shape_id);

						//
					};

					// 4.8.2.
					// Setup the CSV parsing operation

					await parseCsvFile(`${extractDirPath}/trips.txt`, parseEachRow);

					LOGGER.success(`Finished processing "trips.txt" of plan "${planData._id}"`);

					//
				}
				catch (error) {
					LOGGER.error('Error processing "trips.txt" file.', error);
					throw new Error('✖︎ Error processing "trips.txt" file.');
				}

				//
				// Next up: routes.txt
				// For routes, only include the ones referenced in the filtered trips.

				try {
					//

					LOGGER.info(`Reading zip entry "routes.txt" of plan "${planData._id}"...`);

					// 4.9.1.
					// For each route, only save the ones referenced by previously saved trips.

					const parseEachRow = async (data) => {
						//

						//
						// Skip if this row's route_id was not saved before
						if (!referencedRouteIds.has(data.route_id)) return;

						//
						// Format the exported row

						const parsedRowData = {
							agency_id: data.agency_id,
							line_id: data.line_id,
							line_long_name: data.line_long_name,
							line_short_name: data.line_short_name,
							route_color: data.route_color,
							route_id: data.route_id,
							route_long_name: data.route_long_name,
							route_short_name: data.route_short_name,
							route_text_color: data.route_text_color,
						};

						savedRoutes.set(data.route_id, parsedRowData);

						//
					};

					//
					// Setup the CSV parsing operation

					await parseCsvFile(`${extractDirPath}/routes.txt`, parseEachRow);

					LOGGER.success(`Finished processing "routes.txt" of plan "${planData._id}"`);

					//
				}
				catch (error) {
					LOGGER.error('Error processing "routes.txt" file.', error);
					throw new Error('✖︎ Error processing "routes.txt" file.');
				}

				//
				// Next up: shapes.txt
				// Do a similiar check as the previous step. Only include the shapes for trips referenced before.

				try {
					//

					LOGGER.info(`Reading zip entry "shapes.txt" of plan "${planData._id}"...`);

					//
					// For each point of each shape, check if the shape_id was referenced by valid trips.

					const parseEachRow = async (data) => {
						//

						//
						// Skip if this row's trip_id was not saved before

						if (!referencedShapeIds.has(data.shape_id)) return;

						const thisShapeRowPoint: HashedShapePoint = {
							shape_dist_traveled: data.shape_dist_traveled,
							shape_pt_lat: data.shape_pt_lat,
							shape_pt_lon: data.shape_pt_lon,
							shape_pt_sequence: Number(data.shape_pt_sequence),
						};

						//
						// Get the previously saved shape

						const savedShape = savedShapes.has(data.shape_id);

						if (savedShape) {
							// If this shape_id was previously saved, add the current point to it
							savedShapes.get(data.shape_id).push(thisShapeRowPoint);
						}
						else {
							// If this is the first time we're seeing this shape_id, initiate the points array with the current point
							savedShapes.set(data.shape_id, [thisShapeRowPoint]);
						}

						//
					};

					//
					// Setup the CSV parsing operation

					await parseCsvFile(`${extractDirPath}/shapes.txt`, parseEachRow);

					LOGGER.success(`Finished processing "shapes.txt" of plan "${planData._id}"`);

					//
				}
				catch (error) {
					LOGGER.error('Error processing "shapes.txt" file.', error);
					throw new Error('✖︎ Error processing "shapes.txt" file.');
				}

				//
				// Next up: stops.txt
				// For stops, include all of them since we don't have a way to filter them yet like trips/routes/shapes.
				// By saving all of them, we also speed up the processing of each stop_time by including the stop data right away.

				try {
					//

					console.log(`→ Reading zip entry "stops.txt" of plan "${planData._id}"...`);

					//
					// Save all stops, but only the mininum required data.

					const parseEachRow = async (data) => {
						//
						const parsedRowData = {
							stop_id: data.stop_id,
							stop_lat: data.stop_lat,
							stop_lon: data.stop_lon,
							stop_name: data.stop_name,
						};
						//
						savedStops.set(data.stop_id, parsedRowData);
						//
					};

					//
					// Setup the CSV parsing operation

					await parseCsvFile(`${extractDirPath}/stops.txt`, parseEachRow);

					LOGGER.success(`Finished processing "stops.txt" of plan "${planData._id}"`);

					//
				}
				catch (error) {
					LOGGER.error('Error processing "stops.txt" file.', error);
					throw new Error('✖︎ Error processing "stops.txt" file.');
				}

				//
				// Next up: stop_times.txt
				// Do a similiar check as the previous steps. Only include the stop_times for trips referenced before.
				// Since this is the most resource intensive operation of them all, include the associated stop data
				// right away to avoid another lookup later.

				try {
					//

					LOGGER.info(`Reading zip entry "stop_times.txt" of plan "${planData._id}"...`);

					//
					// For each stop of each trip, check if the associated trip_id was saved in the previous step or not.
					// Save valid stop times along with the associated stop data.

					const parseEachRow = async (data) => {
						//

						//
						// Skip if this row's trip_id was not saved before

						if (!savedTrips.has(data.trip_id)) return;

						//
						// Get the associated stop data. Skip if none found.

						const stopData = savedStops.get(data.stop_id);
						if (!stopData) return;

						const parsedRowData: HashedTripWaypoint = {
							arrival_time: data.arrival_time,
							departure_time: data.departure_time,
							drop_off_type: data.drop_off_type,
							pickup_type: data.pickup_type,
							shape_dist_traveled: data.shape_dist_traveled,
							stop_id: data.stop_id,
							stop_lat: stopData.stop_lat,
							stop_lon: stopData.stop_lon,
							stop_name: stopData.stop_name,
							stop_sequence: Number(data.stop_sequence),
							timepoint: data.timepoint,
						};

						const savedStopTime = savedStopTimes.has(data.trip_id);

						if (savedStopTime) {
							savedStopTimes.get(data.trip_id).push(parsedRowData);
						}
						else {
							savedStopTimes.set(data.trip_id, [parsedRowData]);
						}

						referencedStopIds.add(data.stop_id);

						//
					};

					//
					// Setup the CSV parsing operation

					await parseCsvFile(`${extractDirPath}/stop_times.txt`, parseEachRow);

					LOGGER.success(`Finished processing "stop_times.txt" of plan "${planData._id}"`);

					//
				}
				catch (error) {
					LOGGER.error('Error processing "stop_times.txt" file.', error);
					throw new Error('✖︎ Error processing "stop_times.txt" file.');
				}

				//
				// Transform each trip object into the database format, and save it to the database.
				// Combine the previously extracted info from all files into a single object.

				try {
					//

					for (const tripData of savedTrips.values()) {
						//

						//
						// Get associated data

						const calendarDatesData = savedCalendarDates.get(tripData.service_id);
						const stopTimesData = savedStopTimes.get(tripData.trip_id);
						const routeData = savedRoutes.get(tripData.route_id);
						const shapeData = savedShapes.get(tripData.shape_id);

						//
						// Setup the hashed trip data

						const hashableHashedTripData: Omit<CreateHashedTripDto, '_id'> = {
							//
							agency_id: routeData.agency_id,
							//
							line_id: routeData.line_id,
							line_long_name: routeData.line_long_name,
							line_short_name: routeData.line_short_name,
							//
							path: stopTimesData?.sort((a, b) => a.stop_sequence - b.stop_sequence),
							//
							pattern_id: tripData.pattern_id,
							route_color: routeData.route_color,
							//
							route_id: tripData.route_id,
							route_long_name: routeData.route_long_name,
							route_short_name: routeData.route_short_name,
							route_text_color: routeData.route_text_color,
							trip_headsign: tripData.trip_headsign,
							//
						};

						//
						// Hash the hashed trip contents to prevent duplicates
						// Check if this hashed trip already exists. If it does not exist, save it to the database.

						const hashedTripData: CreateHashedTripDto = {
							...hashableHashedTripData,
							_id: crypto.createHash('sha256').update(JSON.stringify(hashableHashedTripData)).digest('hex'),
						};

						const currentHashedTripAlreadyExists = await hashedTrips.findById(hashedTripData._id);

						if (!currentHashedTripAlreadyExists) {
							await hashedTripsDbWritter.write(hashedTripData, { filter: { _id: hashedTripData._id }, upsert: true });
						}

						savedHashedTripIds.add(hashedTripData._id);

						//
						// Setup the hashed shape data

						const hashableHashedShapeData: Omit<CreateHashedShapeDto, '_id'> = {
							agency_id: routeData.agency_id,
							points: shapeData?.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence),
						};

						//
						// Hash the hashed shape contents to prevent duplicates
						// Check if this hashed shape already exists. If it does not exist, save it to the database.

						const hashedShapeData: CreateHashedShapeDto = {
							...hashableHashedShapeData,
							_id: crypto.createHash('sha256').update(JSON.stringify(hashableHashedShapeData)).digest('hex'),
						};

						const currentHashedShapeAlreadyExists = await hashedShapes.findById(hashedShapeData._id);

						if (!currentHashedShapeAlreadyExists) {
							await hashedShapesDbWritter.write(hashedShapeData, { filter: { _id: hashedShapeData._id }, upsert: true });
						}

						savedHashedShapeIds.add(hashedShapeData._id);

						//
						// Create a trip analysis document for each day this trip is scheduled to run

						for (const calendarDate of calendarDatesData) {
							//
							if (hashedTripData?.path?.length === 0) {
								LOGGER.error(`Trip ${tripData.trip_id} has no path data. Skipping...`);
								continue;
							}
							//
							const extensionScheduledInMeters = convertMetersOrKilometersToMeters(hashedTripData.path[hashedTripData.path.length - 1].shape_dist_traveled, hashedTripData.path[hashedTripData.path.length - 1].shape_dist_traveled);
							//
							const startTimeScheduled = hashedTripData.path[0].arrival_time;
							const startTimeScheduledDate = convertOperationTimeStringAndOperationalDateToJsDate(startTimeScheduled, calendarDate);
							//
							const endTimeScheduledString = hashedTripData.path[hashedTripData.path.length - 1].arrival_time;
							const endTimeScheduledDate = convertOperationTimeStringAndOperationalDateToJsDate(endTimeScheduledString, calendarDate);
							const runtimeScheduledMillis = DateTime.fromJSDate(endTimeScheduledDate).toMillis() - DateTime.fromJSDate(startTimeScheduledDate).toMillis();
							const runtimeScheduled = Math.trunc(runtimeScheduledMillis / 1000 / 60);
							//
							const rideData: CreateRideDto = {
								_id: `${planData._id}-${routeData.agency_id}-${calendarDate}-${tripData.trip_id}`,
								agency_id: routeData.agency_id,
								analysis: [],
								driver_ids: [],
								extension_observed: null,
								extension_scheduled: extensionScheduledInMeters,
								hashed_shape_id: hashedShapeData._id,
								hashed_trip_id: hashedTripData._id,
								headsign: tripData.trip_headsign,
								line_id: routeData.line_id,
								operational_date: calendarDate,
								passengers_estimated: null,
								pattern_id: tripData.pattern_id,
								plan_id: planData._id,
								route_id: routeData.route_id,
								runtime_observed: null,
								runtime_scheduled: runtimeScheduled,
								start_time_observed: null,
								start_time_scheduled: startTimeScheduledDate,
								status: 'pending',
								trip_id: tripData.trip_id,
								validations_count: null,
								vehicle_ids: [],
							};
							//
							const ridesOptions = {
								//
								filter: {
									_id: rideData._id,
									// status: 'pending',
								},
								//
								upsert: true,
								//
								write_mode: 'replace',
								//
							};
							//
							await ridesDbWritter.write(rideData, ridesOptions);
							//
							savedRideIds.add(rideData._id);
							//
						}

						//
						// Delete the current trip to free up memory sooner

						savedTrips.delete(tripData.trip_id);
						savedStopTimes.delete(tripData.trip_id);

						//
					}

					await hashedTripsDbWritter.flush();
					await hashedShapesDbWritter.flush();
					await ridesDbWritter.flush();

					//
				}
				catch (error) {
					LOGGER.error('Error transforming or saving Shapes, Trips or Rides to database.', error);
					throw new Error('✖︎ Error transforming or saving Shapes, Trips or Rides to database.');
				}

				//
				// Remove rides that were previously parsed from this plan but which should not be included anymore.
				// Delete all rides for this plan_id that fall outside the current Plan valid range.

				const deleteStaleRidesResult = await rides.deleteMany({ _id: { $nin: Array.from(savedRideIds) }, plan_id: planData._id });
				LOGGER.info(`Deleted ${deleteStaleRidesResult.deletedCount} stale rides from plan ${planData._id}`);

				//
				// Mark this plan as 'success' to indicate that it was processed successfully

				await plans.updateById(planData._id, { feeder_status: 'success' });

				parsedPlanIds.add(planData._id);

				//

				LOGGER.success(`Finished processing plan ${planData._id}`);
				LOGGER.divider();

				//
			}
			catch (error) {
				await plans.updateById(planData._id, { feeder_status: 'error' });
				LOGGER.error(`Error processing plan ${planData._id}`, error);
				LOGGER.divider();
			}

			//
		}

		//
		// Delete all rides from plans that do not exist anymore

		const allPlanIds = allPlansData.map(plan => plan._id);
		const deleteStaleRidesResult = await rides.deleteMany({ plan_id: { $nin: allPlanIds } });
		LOGGER.info(`Deleted ${deleteStaleRidesResult.deletedCount} stale rides from plans that do not exist anymore.`);

		//
		// Remove all hashed trips and shapes that are not referenced by any ride

		const staleHashedShapesTimer = new TIMETRACKER();

		const allHashedShapeIds = await hashedShapesCollection.aggregate([{ $group: { _id: '$_id' } }]).toArray();
		const allHashedShapeIdsUnique = new Set(allHashedShapeIds.map(doc => doc._id));
		const hashedShapeIdsInUse = await ridesCollection.aggregate([{ $group: { _id: '$hashed_shape_id' } }]).toArray();
		hashedShapeIdsInUse.forEach(hashedShapeId => allHashedShapeIdsUnique.delete(hashedShapeId._id));

		if (allHashedShapeIdsUnique.size > 0) {
			const deleteUnusedHashedShapesResult = await hashedShapes.deleteMany({ _id: { $in: Array.from(allHashedShapeIdsUnique) } });
			LOGGER.info(`Deleted ${deleteUnusedHashedShapesResult.deletedCount} unused Hashed Shapes.`);
		}

		LOGGER.info(`Found ${allHashedShapeIdsUnique.size} unused Hashed Shapes. (${staleHashedShapesTimer.get()})`);

		//

		const staleHashedTripsTimer = new TIMETRACKER();

		const allHashedTripIds = await hashedTripsCollection.aggregate([{ $group: { _id: '$_id' } }]).toArray();
		const allHashedTripIdsUnique = new Set(allHashedTripIds.map(doc => doc._id));
		const hashedTripIdsInUse = await ridesCollection.aggregate([{ $group: { _id: '$hashed_trip_id' } }]).toArray();
		hashedTripIdsInUse.forEach(hashedTripId => allHashedTripIdsUnique.delete(hashedTripId._id));

		if (allHashedTripIdsUnique.size > 0) {
			const deleteUnusedHashedTripsResult = await hashedTrips.deleteMany({ _id: { $in: Array.from(allHashedTripIdsUnique) } });
			LOGGER.info(`Deleted ${deleteUnusedHashedTripsResult.deletedCount} unused Hashed Trips.`);
		}

		LOGGER.info(`Found ${allHashedTripIdsUnique.size} unused Hashed Trips. (${staleHashedTripsTimer.get()})`);

		//

		LOGGER.terminate(`Run took ${globalTimer.get()}`);

		//
	}
	catch (error) {
		LOGGER.error('An error occurred. Halting execution.', error);
		LOGGER.error('Retrying in 10 seconds...');
		setTimeout(() => {
			process.exit(0); // End process
		}, 10000); // after 10 seconds
	}

	//
};

/* * */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseCsvFile(filePath: string, rowParser: (rowData: any) => Promise<void>) {
	const parser = csvParser({ bom: true, columns: true, record_delimiter: ['\n', '\r', '\r\n'], skip_empty_lines: true, trim: true });
	const fileStream = fs.createReadStream(filePath);
	const stream = fileStream.pipe(parser);
	for await (const rowData of stream) {
		await rowParser(rowData);
	}
}

/* * */

const unzipFile = async (zipFilePath, outputDir) => {
	await extract(zipFilePath, { dir: outputDir });
	setDirectoryPermissions(outputDir);
};

/* * */

const setDirectoryPermissions = (dirPath, mode = 0o666) => {
	const files = fs.readdirSync(dirPath, { withFileTypes: true });
	for (const file of files) {
		const filePath = `${dirPath}/${file.name}`;
		if (file.isDirectory()) {
			setDirectoryPermissions(filePath, mode);
		}
		else {
			fs.chmodSync(filePath, mode);
		}
	}
};

/* * */

/**
 * This function checks if a value is small enough to be considered a meter value,
 * as it should be used exclusevely for trip distance values.
 * If the value is greater than 1, it is considered to be in meters.
 * Converts a value to meters if it is in kilometers, otherwise returns meters.
 *
 * @param value - The value to be checked
 * @param context - The context in which the value is being used
 * @param ballpark - A ballpark value to be used as a reference. It is recommended to use the total distance of the object.
 * @returns The value in meters
 */
const convertMetersOrKilometersToMeters = (value: number | string, ballpark: number | string): number => {
	//

	const valueAsNumber = Number(value);
	const ballparkAsNumber = Number(ballpark);

	if (Number.isNaN(valueAsNumber)) return -1;
	if (Number.isNaN(ballparkAsNumber)) return -1;

	// If the ballpark is bigger than 800, then the value is in meters
	// Otherwise, the value is in kilometers. This is because it is unlikely
	// that a trip will be smaller than 800 meters, and longer than 800 kilometers.

	if (ballparkAsNumber > 800) {
		return valueAsNumber;
	}
	else {
		return valueAsNumber * 1000;
	}

	//
};

/* * */

const convertOperationTimeStringAndOperationalDateToJsDate = (timeString: string, operationalDate: OperationalDate): Date => {
	//

	// Return early if no time string is provided
	if (!timeString || !operationalDate) return new Date(0);

	// Check if the timestring is in the format HH:MM:SS
	if (!/^\d{2}:\d{2}:\d{2}$/.test(timeString)) return new Date(0);

	// Extract the individual components of the time string (HH:MM:SS)
	const [hoursOperation, minutesOperation, secondsOperation] = timeString.split(':').map(Number);

	return DateTime
		.fromFormat(operationalDate, OPERATIONAL_DATE_FORMAT)
		.setZone('Europe/Lisbon')
		.set({ hour: hoursOperation, minute: minutesOperation, second: secondsOperation })
		.toJSDate();

	//
};
