/* * */

import { type ClickHouseTableSchema } from '@tmlmobilidade/go-clients-clickhouse';
import { type HashedShape, type HashedTrip, type Ride, type RideAnalysisAtLeastOneVehicleEventOnFirstStop, type RideAnalysisAtLeastOneVehicleEventOnLastStop, type RideAnalysisBase, type RideAnalysisExpectedApexValidationInterval, type RideAnalysisExpectedDriverIdQty, type RideAnalysisExpectedStartTime, type RideAnalysisExpectedVehicleEventCoverageGeo, type RideAnalysisExpectedVehicleEventDelay, type RideAnalysisExpectedVehicleEventInterval, type RideAnalysisExpectedVehicleEventQty, type RideAnalysisExpectedVehicleIdQty, type RideAnalysisMatchingApexLocations, type RideAnalysisMatchingVehicleIds, type RideAnalysisSimpleOneApexValidation, type RideAnalysisSimpleOneVehicleEventOrApexValidation, type RideAnalysisSimpleThreeVehicleEvents, type RideAnalysisTransactionSequentiality, type RideMatch } from '@tmlmobilidade/go-types-operation';
import { type SimplifiedVehicleEvent } from '@tmlmobilidade/go-types-vehicle-events';

/* * */

export const hashedShapeTableSchema: ClickHouseTableSchema<HashedShape> = {
	_id: { type: 'String' },
	agency_id: { type: 'LowCardinality(String)' },
	extension: { type: 'UInt32 CODEC(T64, ZSTD)' },
	shape_id: { type: 'LowCardinality(String)' },
	shape_polyline: { type: 'String CODEC(ZSTD)' },
	updated_at: { type: 'Int64 CODEC(DoubleDelta, ZSTD)' },
};

/* * */

export const hashedTripTableSchema: ClickHouseTableSchema<HashedTrip> = {
	_id: { type: 'String' },
	agency_id: { type: 'LowCardinality(String)' },
	arrival_time: { type: 'FixedString(8)' },
	departure_time: { type: 'FixedString(8)' },
	drop_off_type: { type: 'FixedString(1)' },
	pickup_type: { type: 'FixedString(1)' },
	shape_dist_traveled: { type: 'UInt32 CODEC(T64, ZSTD)' },
	shape_id: { type: 'LowCardinality(String)' },
	stop_id: { type: 'LowCardinality(String)' },
	stop_lat: { type: 'Float32 CODEC(Gorilla, ZSTD)' },
	stop_lon: { type: 'Float32 CODEC(Gorilla, ZSTD)' },
	stop_name: { type: 'String CODEC(ZSTD)' },
	stop_sequence: { type: 'UInt16 CODEC(T64, ZSTD)' },
	timepoint: { type: 'Bool' },
	updated_at: { type: 'Int64 CODEC(DoubleDelta, ZSTD)' },
};

/* * */

const rideAnalysisBaseTableSchema: ClickHouseTableSchema<RideAnalysisBase> = {
	agency_id: { type: 'LowCardinality(String)' },
	grade_status: { type: 'LowCardinality(String)' },
	operational_date: { type: 'UInt32' },
	reason: { type: 'LowCardinality(Nullable(String))' },
	remarks: { type: 'Nullable(String) CODEC(ZSTD)' },
	ride_id: { type: 'String' },
	updated_at: { type: 'Int64 CODEC(DoubleDelta, ZSTD)' },
};

/* * */

export const rideAnalysisAtLeastOneVehicleEventOnFirstStopTableSchema: ClickHouseTableSchema<RideAnalysisAtLeastOneVehicleEventOnFirstStop> = {
	...rideAnalysisBaseTableSchema,
	vehicle_events_on_first_stop_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
};

/* * */

export const rideAnalysisAtLeastOneVehicleEventOnLastStopTableSchema: ClickHouseTableSchema<RideAnalysisAtLeastOneVehicleEventOnLastStop> = {
	...rideAnalysisBaseTableSchema,
	vehicle_events_on_last_stop_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
};

/* * */

export const rideAnalysisExpectedApexValidationIntervalTableSchema: ClickHouseTableSchema<RideAnalysisExpectedApexValidationInterval> = {
	...rideAnalysisBaseTableSchema,
	observed_average_interval: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	observed_max_interval: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	observed_min_interval: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
};

/* * */

export const rideAnalysisExpectedDriverIdQtyTableSchema: ClickHouseTableSchema<RideAnalysisExpectedDriverIdQty> = {
	...rideAnalysisBaseTableSchema,
	observed_driver_ids_qty: { type: 'Nullable(UInt8) CODEC(T64, ZSTD)' },
};

/* * */

export const rideAnalysisExpectedStartTimeTableSchema: ClickHouseTableSchema<RideAnalysisExpectedStartTime> = {
	...rideAnalysisBaseTableSchema,
	observed_start_time: { type: 'Nullable(Int64) CODEC(DoubleDelta, ZSTD)' },
	observed_start_time_delta: { type: 'Nullable(Int16) CODEC(T64, ZSTD)' },
};

/* * */

export const rideAnalysisExpectedVehicleEventCoverageGeoTableSchema: ClickHouseTableSchema<RideAnalysisExpectedVehicleEventCoverageGeo> = {
	...rideAnalysisBaseTableSchema,
	stops_coverage_absolute: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	stops_coverage_percentage: { type: 'Nullable(UInt8) CODEC(T64, ZSTD)' },
};

/* * */

export const rideAnalysisExpectedVehicleEventDelayTableSchema: ClickHouseTableSchema<RideAnalysisExpectedVehicleEventDelay> = {
	...rideAnalysisBaseTableSchema,
	observed_average_delay: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	observed_max_delay: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	observed_min_delay: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	vehicle_events_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	vehicle_events_with_delay_percent: { type: 'Nullable(UInt8) CODEC(T64, ZSTD)' },
	vehicle_events_with_delay_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
};

/* * */

export const rideAnalysisExpectedVehicleEventIntervalTableSchema: ClickHouseTableSchema<RideAnalysisExpectedVehicleEventInterval> = {
	...rideAnalysisBaseTableSchema,
	observed_average_interval: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	observed_max_interval: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	observed_min_interval: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
};

/* * */

export const rideAnalysisExpectedVehicleEventQtyTableSchema: ClickHouseTableSchema<RideAnalysisExpectedVehicleEventQty> = {
	...rideAnalysisBaseTableSchema,
	expected_vehicle_events_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	observed_vehicle_events_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
};

/* * */

export const rideAnalysisExpectedVehicleIdQtyTableSchema: ClickHouseTableSchema<RideAnalysisExpectedVehicleIdQty> = {
	...rideAnalysisBaseTableSchema,
	observed_vehicle_ids_qty: { type: 'Nullable(UInt8) CODEC(T64, ZSTD)' },
};

/* * */

export const rideAnalysisMatchingApexLocationsTableSchema: ClickHouseTableSchema<RideAnalysisMatchingApexLocations> = {
	...rideAnalysisBaseTableSchema,
	expected_apex_locations_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	matching_apex_locations_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	missing_apex_locations_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
};

/* * */

export const rideAnalysisMatchingVehicleIdsTableSchema: ClickHouseTableSchema<RideAnalysisMatchingVehicleIds> = {
	...rideAnalysisBaseTableSchema,
	extra_apex_vehicle_ids_qty: { type: 'Nullable(UInt8) CODEC(T64, ZSTD)' },
	extra_vehicle_events_vehicle_ids_qty: { type: 'Nullable(UInt8) CODEC(T64, ZSTD)' },
	matching_vehicle_ids_qty: { type: 'Nullable(UInt8) CODEC(T64, ZSTD)' },
	total_vehicle_ids_qty: { type: 'Nullable(UInt8) CODEC(T64, ZSTD)' },
};

/* * */

export const rideAnalysisSimpleOneApexValidationTableSchema: ClickHouseTableSchema<RideAnalysisSimpleOneApexValidation> = {
	...rideAnalysisBaseTableSchema,
};

/* * */

export const rideAnalysisSimpleOneVehicleEventOrApexValidationTableSchema: ClickHouseTableSchema<RideAnalysisSimpleOneVehicleEventOrApexValidation> = {
	...rideAnalysisBaseTableSchema,
};

/* * */

export const rideAnalysisSimpleThreeVehicleEventsTableSchema: ClickHouseTableSchema<RideAnalysisSimpleThreeVehicleEvents> = {
	...rideAnalysisBaseTableSchema,
	stop_ids_first: { type: 'Array(LowCardinality(String))' },
	stop_ids_last: { type: 'Array(LowCardinality(String))' },
	stop_ids_middle: { type: 'Array(LowCardinality(String))' },
};

/* * */

export const rideAnalysisTransactionSequentialityTableSchema: ClickHouseTableSchema<RideAnalysisTransactionSequentiality> = {
	...rideAnalysisBaseTableSchema,
	expected_transactions_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	found_transactions_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	missing_transactions_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
};

/* * */

export const rideMatchesTableSchema: ClickHouseTableSchema<RideMatch> = {
	_id: { type: 'String' },
	agency_id: { type: 'LowCardinality(String)' },
	operational_dates: { type: 'Array(UInt32) CODEC(ZSTD)' },
	processing_status: { type: 'LowCardinality(String)' },
	trip_id: { type: 'LowCardinality(String)' },
	updated_at: { type: 'Int64 CODEC(DoubleDelta, ZSTD)' },
	window_end: { type: 'Int64 CODEC(DoubleDelta, ZSTD)' },
	window_start: { type: 'Int64 CODEC(DoubleDelta, ZSTD)' },
};

/* * */

export const ridesTableSchema: ClickHouseTableSchema<Ride> = {
	_id: { type: 'String' },
	agency_code: { type: 'LowCardinality(String)' },
	agency_id: { type: 'LowCardinality(String)' },
	apex_banking_taps_amount: { type: 'Nullable(Int32) CODEC(T64, ZSTD)' },
	apex_banking_taps_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	apex_locations_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	apex_refunds_amount: { type: 'Nullable(Int32) CODEC(T64, ZSTD)' },
	apex_refunds_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	apex_sales_amount: { type: 'Nullable(Int32) CODEC(T64, ZSTD)' },
	apex_sales_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	apex_validations_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	direction_id: { type: 'FixedString(1)' },
	driver_ids: { type: 'Array(LowCardinality(String))' },
	end_time_observed: { type: 'Nullable(Int64) CODEC(DoubleDelta, ZSTD)' },
	end_time_scheduled: { type: 'Int64 CODEC(DoubleDelta, ZSTD)' },
	extension_observed: { type: 'Nullable(UInt32) CODEC(T64, ZSTD)' },
	extension_scheduled: { type: 'UInt32 CODEC(T64, ZSTD)' },
	hashed_shape_id: { type: 'LowCardinality(String)' },
	hashed_trip_id: { type: 'LowCardinality(String)' },
	headsign: { type: 'LowCardinality(String)' },
	operational_date: { type: 'UInt32' },
	passengers_estimated: { type: 'Nullable(UInt32) CODEC(T64, ZSTD)' },
	passengers_observed: { type: 'Nullable(UInt32) CODEC(T64, ZSTD)' },
	passengers_observed_banking_taps_amount: { type: 'Nullable(Int32) CODEC(T64, ZSTD)' },
	passengers_observed_banking_taps_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	passengers_observed_prepaid_amount: { type: 'Nullable(Int32) CODEC(T64, ZSTD)' },
	passengers_observed_prepaid_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	passengers_observed_sales_amount: { type: 'Nullable(Int32) CODEC(T64, ZSTD)' },
	passengers_observed_sales_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	passengers_observed_subscription_qty: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	plan_id: { type: 'LowCardinality(String)' },
	processing_status: { type: 'LowCardinality(String)' },
	route_color: { type: 'FixedString(7)' },
	route_id: { type: 'LowCardinality(String)' },
	route_long_name: { type: 'LowCardinality(String)' },
	route_short_name: { type: 'LowCardinality(String)' },
	route_text_color: { type: 'FixedString(7)' },
	seen_first_at: { type: 'Nullable(Int64) CODEC(DoubleDelta, ZSTD)' },
	seen_last_at: { type: 'Nullable(Int64) CODEC(DoubleDelta, ZSTD)' },
	shape_id: { type: 'LowCardinality(String)' },
	start_time_observed: { type: 'Nullable(Int64) CODEC(DoubleDelta, ZSTD)' },
	start_time_scheduled: { type: 'Int64 CODEC(DoubleDelta, ZSTD)' },
	timezone: { type: 'LowCardinality(String)' },
	trip_id: { type: 'LowCardinality(String)' },
	updated_at: { type: 'Int64 CODEC(DoubleDelta, ZSTD)' },
	vehicle_ids: { type: 'Array(LowCardinality(String))' },
};

/* * */

export const simplifiedVehicleEventTableSchema: ClickHouseTableSchema<SimplifiedVehicleEvent> = {
	_id: { type: 'String' },
	agency_id: { type: 'LowCardinality(String)' },
	bearing: { type: 'Nullable(UInt16) CODEC(T64, ZSTD)' },
	created_at: { type: 'Int64 CODEC(DoubleDelta, ZSTD)' },
	current_status: { type: 'LowCardinality(Nullable(String))' },
	driver_id: { type: 'LowCardinality(Nullable(String))' },
	extra_trip_id: { type: 'Nullable(String)' },
	geohash: { materialized: 'geohashEncode(longitude, latitude, 7)', type: 'FixedString(7)' },
	latitude: { type: 'Float32 CODEC(Gorilla, ZSTD)' },
	longitude: { type: 'Float32 CODEC(Gorilla, ZSTD)' },
	odometer: { type: 'Nullable(UInt32)' },
	operational_date: { type: 'UInt32' },
	received_at: { type: 'Int64 CODEC(DoubleDelta, ZSTD)' },
	speed: { type: 'Nullable(UInt8) CODEC(T64, ZSTD)' },
	stop_id: { type: 'LowCardinality(Nullable(String))' },
	trip_id: { type: 'String' },
	vehicle_id: { type: 'LowCardinality(String)' },
};
