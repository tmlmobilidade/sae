/* * */

import { getQualifiedRouteId, getQualifiedShapeId, getQualifiedTripId } from '@tmlmobilidade/go-hub-pckg-utils';
import { cacheDb } from '@tmlmobilidade/go-interfaces-cachedb';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type GtfsRtFeedEntity, GtfsRtFeedEntitySchema, type GtfsRtFeedMessage, GtfsRtFeedMessageSchema } from '@tmlmobilidade/go-types-gtfs-rt';
import { type HubV1ApiVehiclePosition, HubV1ApiVehiclePositionSchema } from '@tmlmobilidade/go-types-hub';
import { type Ride, Vehicle } from '@tmlmobilidade/go-types-operation';
import { DegreesSchema, OperationalDateIntSchema, toCalendarDate, UnixSecondsSchema } from '@tmlmobilidade/go-types-shared';
import { type SimplifiedVehicleEvent } from '@tmlmobilidade/go-types-vehicle-events';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { calculateBearingInDegrees } from '@tmlmobilidade/go-utils-geo';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/* * */

type QueryResult =
  Pick<Ride, 'direction_id' | 'plan_id' | 'route_id' | 'route_short_name' | 'shape_id'>
  & Pick<SimplifiedVehicleEvent,
  | '_id'
  | 'agency_id'
  | 'bearing'
  | 'created_at'
  | 'current_status'
  | 'geohash'
  | 'latitude'
  | 'longitude'
  | 'operational_date'
  | 'received_at'
  | 'speed'
  | 'stop_id'
  | 'trip_id'
  | 'vehicle_id'
  >
  & { ride_id: string };

/* * */

export async function publishVehiclesPositions() {
	//

	Logger.title('Publishing latest vehicles positions...');

	const timer = new Timer();

	//
	// Retrieve active plans from the database

	const metadataTimer = new Timer();

	const vehiclesMetadata = await goDb.operation.vehicles.findMany({});

	const vehiclesMetadataMap = new Map<string, Vehicle>(vehiclesMetadata.map(vehicle => [`${vehicle.agency_id}:${vehicle.vehicle_id}`, vehicle]));

	Logger.info({ message: `Retrieved ${vehiclesMetadataMap.size} vehicles metadata in ${metadataTimer.get()}` });

	//
	// Retrieve the two latest vehicle positions for each vehicle,
	// and create a map by vehicle ID

	const queryTimer = new Timer();

	const latestVehiclePositions = await labDb.queryFromString<QueryResult>(`
		SELECT
			sve._id,
			sve.agency_id,
			sve.vehicle_id,
			sve.created_at,
			sve.current_status,
			sve.geohash,
			sve.latitude,
			sve.longitude,
			sve.operational_date,
			sve.received_at,
			sve.speed,
			sve.stop_id,
			sve.trip_id,
			sve.bearing,
			r._id AS ride_id,
			r.direction_id,
			r.plan_id,
			r.route_short_name,
			r.route_id,
			r.shape_id
		FROM
		(
			SELECT
				_id,
				agency_id,
				vehicle_id,
				created_at,
				current_status,
				geohash,
				latitude,
				longitude,
				operational_date,
				received_at,
				speed,
				stop_id,
				trip_id,
				bearing
			FROM operation.simplified_vehicle_events
			WHERE created_at > toUnixTimestamp64Milli(now64(3) - INTERVAL 90 SECOND)
			LIMIT 2 BY agency_id, vehicle_id
		) AS sve
		ANY INNER JOIN operation.rides AS r
			ON r.agency_id = sve.agency_id
			AND r.operational_date = sve.operational_date
			AND r.trip_id = sve.trip_id
	`);

	const vehiclePositionsMap = new Map<string, QueryResult[]>();

	for (const position of latestVehiclePositions) {
		const key = `${position.agency_id}:${position.vehicle_id}`;
		if (!vehiclePositionsMap.has(key)) vehiclePositionsMap.set(key, []);
		vehiclePositionsMap.get(key).push(position);
	}

	Logger.info({ message: `Got ${latestVehiclePositions.length} vehicle positions for ${vehiclePositionsMap.size} vehicles from LabDB (${queryTimer.get()})` });

	//
	// Prepare each vehicle position for publication,
	// adding the bearing to the position if two positions are available
	// and if the current position does not already have a bearing value.

	const parseTimer = new Timer();

	const hubVehiclePositionsJson: HubV1ApiVehiclePosition[] = [];
	const hubVehiclePositionsGtfsRt: GtfsRtFeedEntity[] = [];

	for (const [key, vehiclePositions] of vehiclePositionsMap.entries() as IterableIterator<[string, QueryResult[]]>) {
		//

		let currentPosition: QueryResult;
		let previousPosition: null | QueryResult;

		if (vehiclePositions.length === 2) {
			const sortedPositionsDesc = vehiclePositions.sort((a, b) => a.created_at - b.created_at);
			currentPosition = sortedPositionsDesc[0];
			previousPosition = sortedPositionsDesc[1];
		} else {
			currentPosition = vehiclePositions[0];
		}

		//
		// Calculate the bearing if two positions are available
		// and if the current position does not already have a bearing value.

		let bearingValue: number | undefined = currentPosition.bearing;

		if (vehiclePositions.length === 2 && !bearingValue) {
			const result = calculateBearingInDegrees([currentPosition.longitude, currentPosition.latitude], [previousPosition.longitude, previousPosition.latitude]);
			if (result) bearingValue = result;
		}

		//
		// Retrieve the vehicle metadata

		const vehicleMetadata = vehiclesMetadataMap.get(key);

		//
		// Transform the current position into
		// the Hub V1 API Vehicle Position format

		const hubV1Json = HubV1ApiVehiclePositionSchema.safeParse({
			_id: currentPosition._id,
			agency_id: currentPosition.agency_id,
			bearing: bearingValue ? DegreesSchema.parse(bearingValue) : undefined,
			calendar_date: toCalendarDate(currentPosition.operational_date),
			created_at: currentPosition.created_at,
			current_status: currentPosition.current_status,
			direction_id: currentPosition.direction_id,
			geohash: currentPosition.geohash,
			latitude: currentPosition.latitude,
			longitude: currentPosition.longitude,
			operational_date: currentPosition.operational_date,
			received_at: currentPosition.received_at,
			ride_id: currentPosition.ride_id,
			route_id: getQualifiedRouteId(currentPosition.agency_id, currentPosition.route_id),
			route_short_name: currentPosition.route_short_name,
			shape_id: getQualifiedShapeId(currentPosition.plan_id, currentPosition.agency_id, currentPosition.shape_id),
			speed: currentPosition.speed,
			stop_id: currentPosition.stop_id,
			trip_id: getQualifiedTripId(currentPosition.plan_id, currentPosition.agency_id, currentPosition.trip_id),
			vehicle_id: currentPosition.vehicle_id,
		});

		if (!hubV1Json.success) throw new Error(`Failed to parse Hub V1 API Vehicle Position: ${hubV1Json.error.message}`);

		hubVehiclePositionsJson.push(hubV1Json.data);

		//
		// Transform the current position into
		// the GTFS-RT Vehicle Position format

		const hubV1GtfsRt = GtfsRtFeedEntitySchema.parse({
			id: currentPosition._id,
			vehicle: {
				current_status: currentPosition.current_status,
				position: {
					bearing: currentPosition.bearing,
					latitude: currentPosition.latitude,
					longitude: currentPosition.longitude,
					speed: currentPosition.speed,
				},
				stop_id: currentPosition.stop_id,
				timestamp: UnixSecondsSchema.parse(currentPosition.created_at / 1000),
				trip: {
					direction_id: currentPosition.direction_id,
					route_id: getQualifiedRouteId(currentPosition.agency_id, currentPosition.route_id),
					schedule_relationship: 'SCHEDULED',
					start_date: OperationalDateIntSchema.parse(currentPosition.operational_date),
					trip_id: getQualifiedTripId(currentPosition.plan_id, currentPosition.agency_id, currentPosition.trip_id),
				},
				vehicle: {
					id: currentPosition.vehicle_id,
					label: vehicleMetadata?.license_plate,
					license_plate: vehicleMetadata?.license_plate,
					wheelchair_accessible: vehicleMetadata?.wheelchair ? 'WHEELCHAIR_ACCESSIBLE' : 'UNKNOWN',
				},
			},
		});

		hubVehiclePositionsGtfsRt.push(hubV1GtfsRt);
	}

	//
	// Finalize the GTFS-RT feed message

	const gtfsRtFeedMessage: GtfsRtFeedMessage = {
		entity: hubVehiclePositionsGtfsRt,
		header: {
			gtfs_realtime_version: '2.0',
			incrementality: 'FULL_DATASET',
			timestamp: Dates.now('utc').unix_seconds,
		},
	};

	const validatedGtfsRtFeedMessage = GtfsRtFeedMessageSchema.parse(gtfsRtFeedMessage);

	Logger.info({ message: `Parsed ${hubVehiclePositionsJson.length} vehicle positions to JSON and ${hubVehiclePositionsGtfsRt.length} vehicle positions to GTFS-RT in ${parseTimer.get()}` });

	//
	// Save the vehicle positions to the cache

	const saveTimer = new Timer();

	await cacheDb.set('hub:v1:realtime:vehicles:positions:json', JSON.stringify(hubVehiclePositionsJson), 600);
	Logger.success(`Finished publishing latest vehicles positions (${saveTimer.get()})`);

	await cacheDb.set('hub:v1:realtime:vehicles:positions:gtfs', JSON.stringify(validatedGtfsRtFeedMessage), 600);
	Logger.success(`Finished publishing latest vehicles positions GTFS-RT (${saveTimer.get()})`);

	Logger.info({ message: `Run complete in ${timer.get()}` });

	//
};
