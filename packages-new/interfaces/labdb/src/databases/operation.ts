/* * */

import { ClickHouseInterfaceTemplate } from '@/interface.template.js';
import { hashedShapeTableSchema, hashedTripTableSchema, rideAnalysisAtLeastOneVehicleEventOnFirstStopTableSchema, rideAnalysisAtLeastOneVehicleEventOnLastStopTableSchema, rideAnalysisExpectedApexValidationIntervalTableSchema, rideAnalysisExpectedDriverIdQtyTableSchema, rideAnalysisExpectedStartTimeTableSchema, rideAnalysisExpectedVehicleEventCoverageGeoTableSchema, rideAnalysisExpectedVehicleEventDelayTableSchema, rideAnalysisExpectedVehicleEventIntervalTableSchema, rideAnalysisExpectedVehicleEventQtyTableSchema, rideAnalysisExpectedVehicleIdQtyTableSchema, rideAnalysisMatchingApexLocationsTableSchema, rideAnalysisMatchingVehicleIdsTableSchema, rideAnalysisSimpleOneApexValidationTableSchema, rideAnalysisSimpleOneVehicleEventOrApexValidationTableSchema, rideAnalysisSimpleThreeVehicleEventsTableSchema, rideAnalysisTransactionSequentialityTableSchema, ridesTableSchema, simplifiedVehicleEventTableSchema } from '@/schemas/operation.js';
import { ClickHouseClient } from '@tmlmobilidade/go-clients-clickhouse';
import { type HashedShape, type HashedTrip, type Ride, type RideAnalysisAtLeastOneVehicleEventOnFirstStop, type RideAnalysisAtLeastOneVehicleEventOnLastStop, type RideAnalysisExpectedApexValidationInterval, type RideAnalysisExpectedDriverIdQty, type RideAnalysisExpectedStartTime, type RideAnalysisExpectedVehicleEventCoverageGeo, type RideAnalysisExpectedVehicleEventDelay, type RideAnalysisExpectedVehicleEventInterval, type RideAnalysisExpectedVehicleEventQty, type RideAnalysisExpectedVehicleIdQty, type RideAnalysisMatchingApexLocations, type RideAnalysisMatchingVehicleIds, type RideAnalysisSimpleOneApexValidation, type RideAnalysisSimpleOneVehicleEventOrApexValidation, type RideAnalysisSimpleThreeVehicleEvents, type RideAnalysisTransactionSequentiality } from '@tmlmobilidade/go-types-operation';
import { type SimplifiedVehicleEvent } from '@tmlmobilidade/go-types-vehicle-events';

/* * */

export class OperationDatabase {
	//

	public readonly hashedShapes: ClickHouseInterfaceTemplate<HashedShape>;
	public readonly hashedTrips: ClickHouseInterfaceTemplate<HashedTrip>;
	public readonly rideAnalysisAtLeastOneVehicleEventOnFirstStop: ClickHouseInterfaceTemplate<RideAnalysisAtLeastOneVehicleEventOnFirstStop>;
	public readonly rideAnalysisAtLeastOneVehicleEventOnLastStop: ClickHouseInterfaceTemplate<RideAnalysisAtLeastOneVehicleEventOnLastStop>;
	public readonly rideAnalysisExpectedApexValidationInterval: ClickHouseInterfaceTemplate<RideAnalysisExpectedApexValidationInterval>;
	public readonly rideAnalysisExpectedDriverIdQty: ClickHouseInterfaceTemplate<RideAnalysisExpectedDriverIdQty>;
	public readonly rideAnalysisExpectedStartTime: ClickHouseInterfaceTemplate<RideAnalysisExpectedStartTime>;
	public readonly rideAnalysisExpectedVehicleEventCoverageGeo: ClickHouseInterfaceTemplate<RideAnalysisExpectedVehicleEventCoverageGeo>;
	public readonly rideAnalysisExpectedVehicleEventDelay: ClickHouseInterfaceTemplate<RideAnalysisExpectedVehicleEventDelay>;
	public readonly rideAnalysisExpectedVehicleEventInterval: ClickHouseInterfaceTemplate<RideAnalysisExpectedVehicleEventInterval>;
	public readonly rideAnalysisExpectedVehicleEventQty: ClickHouseInterfaceTemplate<RideAnalysisExpectedVehicleEventQty>;
	public readonly rideAnalysisExpectedVehicleIdQty: ClickHouseInterfaceTemplate<RideAnalysisExpectedVehicleIdQty>;
	public readonly rideAnalysisMatchingApexLocations: ClickHouseInterfaceTemplate<RideAnalysisMatchingApexLocations>;
	public readonly rideAnalysisMatchingVehicleIds: ClickHouseInterfaceTemplate<RideAnalysisMatchingVehicleIds>;
	public readonly rideAnalysisSimpleOneApexValidation: ClickHouseInterfaceTemplate<RideAnalysisSimpleOneApexValidation>;
	public readonly rideAnalysisSimpleOneVehicleEventOrApexValidation: ClickHouseInterfaceTemplate<RideAnalysisSimpleOneVehicleEventOrApexValidation>;
	public readonly rideAnalysisSimpleThreeVehicleEvents: ClickHouseInterfaceTemplate<RideAnalysisSimpleThreeVehicleEvents>;
	public readonly rideAnalysisTransactionSequentiality: ClickHouseInterfaceTemplate<RideAnalysisTransactionSequentiality>;
	public readonly rides: ClickHouseInterfaceTemplate<Ride>;
	public readonly simplifiedVehicleEvents: ClickHouseInterfaceTemplate<SimplifiedVehicleEvent>;

	private readonly databaseName = 'operation';

	public constructor(instance: ClickHouseClient) {
		this.hashedShapes = new ClickHouseInterfaceTemplate<HashedShape>(instance, this.databaseName, 'hashed_shapes', hashedShapeTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['_id', 'shape_id'],
			partitionBy: undefined,
		});
		this.hashedTrips = new ClickHouseInterfaceTemplate<HashedTrip>(instance, this.databaseName, 'hashed_trips', hashedTripTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['_id', 'stop_sequence'],
			partitionBy: undefined,
		});
		this.rideAnalysisAtLeastOneVehicleEventOnFirstStop = new ClickHouseInterfaceTemplate<RideAnalysisAtLeastOneVehicleEventOnFirstStop>(instance, this.databaseName, 'ride_analysis_at_least_one_vehicle_event_on_first_stop', rideAnalysisAtLeastOneVehicleEventOnFirstStopTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisAtLeastOneVehicleEventOnLastStop = new ClickHouseInterfaceTemplate<RideAnalysisAtLeastOneVehicleEventOnLastStop>(instance, this.databaseName, 'ride_analysis_at_least_one_vehicle_event_on_last_stop', rideAnalysisAtLeastOneVehicleEventOnLastStopTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisExpectedApexValidationInterval = new ClickHouseInterfaceTemplate<RideAnalysisExpectedApexValidationInterval>(instance, this.databaseName, 'ride_analysis_expected_apex_validation_interval', rideAnalysisExpectedApexValidationIntervalTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisExpectedDriverIdQty = new ClickHouseInterfaceTemplate<RideAnalysisExpectedDriverIdQty>(instance, this.databaseName, 'ride_analysis_expected_driver_id_qty', rideAnalysisExpectedDriverIdQtyTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisExpectedStartTime = new ClickHouseInterfaceTemplate<RideAnalysisExpectedStartTime>(instance, this.databaseName, 'ride_analysis_expected_start_time', rideAnalysisExpectedStartTimeTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisExpectedVehicleEventCoverageGeo = new ClickHouseInterfaceTemplate<RideAnalysisExpectedVehicleEventCoverageGeo>(instance, this.databaseName, 'ride_analysis_expected_vehicle_event_coverage_geo', rideAnalysisExpectedVehicleEventCoverageGeoTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisExpectedVehicleEventDelay = new ClickHouseInterfaceTemplate<RideAnalysisExpectedVehicleEventDelay>(instance, this.databaseName, 'ride_analysis_expected_vehicle_event_delay', rideAnalysisExpectedVehicleEventDelayTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisExpectedVehicleEventInterval = new ClickHouseInterfaceTemplate<RideAnalysisExpectedVehicleEventInterval>(instance, this.databaseName, 'ride_analysis_expected_vehicle_event_interval', rideAnalysisExpectedVehicleEventIntervalTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisExpectedVehicleEventQty = new ClickHouseInterfaceTemplate<RideAnalysisExpectedVehicleEventQty>(instance, this.databaseName, 'ride_analysis_expected_vehicle_event_qty', rideAnalysisExpectedVehicleEventQtyTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisExpectedVehicleIdQty = new ClickHouseInterfaceTemplate<RideAnalysisExpectedVehicleIdQty>(instance, this.databaseName, 'ride_analysis_expected_vehicle_id_qty', rideAnalysisExpectedVehicleIdQtyTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisMatchingApexLocations = new ClickHouseInterfaceTemplate<RideAnalysisMatchingApexLocations>(instance, this.databaseName, 'ride_analysis_matching_apex_locations', rideAnalysisMatchingApexLocationsTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisMatchingVehicleIds = new ClickHouseInterfaceTemplate<RideAnalysisMatchingVehicleIds>(instance, this.databaseName, 'ride_analysis_matching_vehicle_ids', rideAnalysisMatchingVehicleIdsTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisSimpleOneApexValidation = new ClickHouseInterfaceTemplate<RideAnalysisSimpleOneApexValidation>(instance, this.databaseName, 'ride_analysis_simple_one_apex_validation', rideAnalysisSimpleOneApexValidationTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisSimpleOneVehicleEventOrApexValidation = new ClickHouseInterfaceTemplate<RideAnalysisSimpleOneVehicleEventOrApexValidation>(instance, this.databaseName, 'ride_analysis_simple_one_vehicle_event_or_apex_validation', rideAnalysisSimpleOneVehicleEventOrApexValidationTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisSimpleThreeVehicleEvents = new ClickHouseInterfaceTemplate<RideAnalysisSimpleThreeVehicleEvents>(instance, this.databaseName, 'ride_analysis_simple_three_vehicle_events', rideAnalysisSimpleThreeVehicleEventsTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rideAnalysisTransactionSequentiality = new ClickHouseInterfaceTemplate<RideAnalysisTransactionSequentiality>(instance, this.databaseName, 'ride_analysis_transaction_sequentiality', rideAnalysisTransactionSequentialityTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['ride_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.rides = new ClickHouseInterfaceTemplate<Ride>(instance, this.databaseName, 'rides', ridesTableSchema, {
			engine: 'ReplacingMergeTree(updated_at)',
			orderBy: ['agency_id', 'operational_date', 'route_short_name', 'shape_id', 'start_time_scheduled', '_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
		this.simplifiedVehicleEvents = new ClickHouseInterfaceTemplate<SimplifiedVehicleEvent>(instance, this.databaseName, 'simplified_vehicle_events', simplifiedVehicleEventTableSchema, {
			engine: 'ReplacingMergeTree(created_at)',
			orderBy: ['agency_id', 'operational_date', 'vehicle_id', 'created_at', '_id'],
			partitionBy: 'intDiv(operational_date, 100)',
		});
	}

	public async init() {
		await this.hashedShapes.init();
		await this.hashedTrips.init();
		await this.rideAnalysisAtLeastOneVehicleEventOnFirstStop.init();
		await this.rideAnalysisAtLeastOneVehicleEventOnLastStop.init();
		await this.rideAnalysisExpectedApexValidationInterval.init();
		await this.rideAnalysisExpectedDriverIdQty.init();
		await this.rideAnalysisExpectedStartTime.init();
		await this.rideAnalysisExpectedVehicleEventCoverageGeo.init();
		await this.rideAnalysisExpectedVehicleEventDelay.init();
		await this.rideAnalysisExpectedVehicleEventInterval.init();
		await this.rideAnalysisExpectedVehicleEventQty.init();
		await this.rideAnalysisExpectedVehicleIdQty.init();
		await this.rideAnalysisMatchingApexLocations.init();
		await this.rideAnalysisMatchingVehicleIds.init();
		await this.rideAnalysisSimpleOneApexValidation.init();
		await this.rideAnalysisSimpleOneVehicleEventOrApexValidation.init();
		await this.rideAnalysisSimpleThreeVehicleEvents.init();
		await this.rideAnalysisTransactionSequentiality.init();
		await this.rides.init();
		await this.simplifiedVehicleEvents.init();
	}
}
