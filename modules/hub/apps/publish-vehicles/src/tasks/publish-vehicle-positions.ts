/* * */

import { getQualifiedPatternId, getQualifiedRouteId, getQualifiedShapeId, getQualifiedTripId, getQualifiedVehicleId } from '@tmlmobilidade/go-hub-pckg-utils';
import { cacheDb } from '@tmlmobilidade/go-interfaces-cachedb';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type GtfsRtFeedEntity, GtfsRtFeedEntitySchema, type GtfsRtFeedMessage, GtfsRtFeedMessageSchema } from '@tmlmobilidade/go-types-gtfs-rt';
import { type HubV1ApiVehiclePosition, HubV1ApiVehiclePositionSchema } from '@tmlmobilidade/go-types-hub';
import { type Ride } from '@tmlmobilidade/go-types-operation';
import { DegreesSchema, OperationalDateIntSchema, toCalendarDate, UnixSecondsSchema } from '@tmlmobilidade/go-types-shared';
import { type SimplifiedVehicleEvent } from '@tmlmobilidade/go-types-vehicle-events';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { calculateBearingInDegrees, getDistanceBetweenPositions } from '@tmlmobilidade/go-utils-geo';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

import { getVehiclesMetadataMap } from '../utils/get-vehicles-metadata-map.js';

/* * */

type QueryResult =
  Pick<Ride, 'direction_id' | 'operational_date' | 'plan_id' | 'route_id' | 'route_short_name' | 'shape_id'>
  & Pick<SimplifiedVehicleEvent,
  | '_id'
  | 'agency_id'
  | 'bearing'
  | 'created_at'
  | 'current_status'
  | 'geohash'
  | 'latitude'
  | 'longitude'
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
	// Retrieve active plans from local cache

	const metadataTimer = new Timer();

	const vehiclesMetadata = await getVehiclesMetadataMap();

	Logger.info({ message: `Retrieved ${vehiclesMetadata.size} vehicle metadata in ${metadataTimer.get()}` });

	//
	// Retrieve the two latest vehicle positions for each vehicle,
	// and create a map by vehicle ID

	const queryTimer = new Timer();

	const latestVehiclePositions = await labDb.queryFromFile<QueryResult>(sqlPath('hub', 'publish-vehicles/select-vehicle-positions.sql'));

	const vehiclePositionsMap = new Map<string, QueryResult[]>();

	for (const position of latestVehiclePositions) {
		const key = `${position.agency_id}:${position.vehicle_id}`;
		if (!vehiclePositionsMap.has(key)) vehiclePositionsMap.set(key, []);
		vehiclePositionsMap.get(key)?.push(position);
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
			currentPosition = vehiclePositions[0];
			previousPosition = vehiclePositions[1];
		} else {
			currentPosition = vehiclePositions[0];
			previousPosition = null;
		}

		//
		// Calculate the bearing if two positions are available
		// and if the current position does not already have a bearing value.

		let bearingValue: null | number = currentPosition.bearing;
		let bearingMethod: HubV1ApiVehiclePosition['bearing_method'] = currentPosition.bearing ? 'measured' : 'skipped';

		if (!currentPosition.bearing && previousPosition) {
			const distanceBetweenPositions = getDistanceBetweenPositions([currentPosition.longitude, currentPosition.latitude], [previousPosition.longitude, previousPosition.latitude]);
			if (distanceBetweenPositions < 50 && previousPosition.bearing) {
				// Accept the previous position's bearing value if the distance
				// between the positions is less than 50 meters.
				bearingValue = previousPosition.bearing;
				bearingMethod = 'kept_prev_value';
			} else {
				// Otherwise, calculate the bearing between the positions.
				const result = calculateBearingInDegrees([currentPosition.longitude, currentPosition.latitude], [previousPosition.longitude, previousPosition.latitude]);
				if (result) {
					bearingValue = result;
					bearingMethod = 'inferred';
				}
			}
		}

		//
		// Retrieve the vehicle metadata

		const vehicleMetadata = vehiclesMetadata.get(key);

		//
		// Transform the current position into
		// the Hub V1 API Vehicle Position format

		const hubV1Json = HubV1ApiVehiclePositionSchema.safeParse({
			_id: currentPosition._id,
			agency_id: currentPosition.agency_id,
			bearing: bearingValue ? DegreesSchema.parse(bearingValue) : undefined,
			bearing_method: bearingMethod,
			calendar_date: toCalendarDate(currentPosition.operational_date),
			created_at: currentPosition.created_at,
			current_status: currentPosition.current_status,
			direction_id: currentPosition.direction_id,
			geohash: currentPosition.geohash,
			latitude: currentPosition.latitude,
			license_plate: vehicleMetadata?.license_plate,
			longitude: currentPosition.longitude,
			operational_date: currentPosition.operational_date,
			pattern_id: getQualifiedPatternId(currentPosition.agency_id, currentPosition.shape_id),
			received_at: currentPosition.received_at,
			ride_id: currentPosition.ride_id,
			route_id: getQualifiedRouteId(currentPosition.agency_id, currentPosition.route_id),
			route_short_name: currentPosition.route_short_name,
			shape_id: getQualifiedShapeId(currentPosition.plan_id, currentPosition.agency_id, currentPosition.shape_id),
			speed: currentPosition.speed,
			stop_id: currentPosition.stop_id,
			trip_id: getQualifiedTripId(currentPosition.plan_id, currentPosition.agency_id, currentPosition.trip_id),
			vehicle_id: getQualifiedVehicleId(currentPosition.agency_id, currentPosition.vehicle_id),
		});

		if (!hubV1Json.success) throw new Error(`Failed to parse Hub V1 API Vehicle Position: ${hubV1Json.error.message}`);

		if (currentPosition.vehicle_id === '2031') console.log(hubV1Json.data);

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
					id: getQualifiedVehicleId(currentPosition.agency_id, currentPosition.vehicle_id),
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

	await cacheDb.setNew('hub:v1:realtime:vehicles:positions:json', hubVehiclePositionsJson, 600);
	Logger.success(`Finished publishing latest vehicles positions (${saveTimer.get()})`);

	await cacheDb.set('hub:v1:realtime:vehicles:positions:gtfs', JSON.stringify(validatedGtfsRtFeedMessage), 600);
	Logger.success(`Finished publishing latest vehicles positions GTFS-RT (${saveTimer.get()})`);

	Logger.info({ message: `Run complete in ${timer.get()}` });

	//
};
