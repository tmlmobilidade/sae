/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type Ride, RideAnalysesRegistry, type RideAnalysisAtLeastOneVehicleEventOnFirstStop, type RideAnalysisAtLeastOneVehicleEventOnLastStop, type RideAnalysisExpectedApexValidationInterval, type RideAnalysisExpectedDriverIdQty, type RideAnalysisExpectedStartTime, RideAnalysisExpectedVehicleEventCoverageGeo, type RideAnalysisExpectedVehicleEventDelay, type RideAnalysisExpectedVehicleEventInterval, type RideAnalysisExpectedVehicleEventQty, type RideAnalysisExpectedVehicleIdQty, type RideAnalysisMatchingApexLocations, type RideAnalysisMatchingVehicleIds, type RideAnalysisSimpleOneApexValidation, type RideAnalysisSimpleOneVehicleEventOrApexValidation, type RideAnalysisSimpleThreeVehicleEvents, type RideAnalysisTransactionSequentiality } from '@tmlmobilidade/go-types-operation';
import { BatchWriter } from '@tmlmobilidade/go-utils-exec';

/* * */

type WritersRegistry = RideAnalysesRegistry & {
	rides: Ride
};

export const writers: { [K in keyof WritersRegistry]: BatchWriter<WritersRegistry[K]> } = {

	at_least_one_vehicle_event_on_first_stop: new BatchWriter<RideAnalysisAtLeastOneVehicleEventOnFirstStop>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisAtLeastOneVehicleEventOnFirstStop.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisAtLeastOneVehicleEventOnFirstStop.getTableName(),
	}),

	at_least_one_vehicle_event_on_last_stop: new BatchWriter<RideAnalysisAtLeastOneVehicleEventOnLastStop>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisAtLeastOneVehicleEventOnLastStop.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisAtLeastOneVehicleEventOnLastStop.getTableName(),
	}),

	expected_apex_validation_interval: new BatchWriter<RideAnalysisExpectedApexValidationInterval>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisExpectedApexValidationInterval.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisExpectedApexValidationInterval.getTableName(),
	}),

	expected_driver_id_qty: new BatchWriter<RideAnalysisExpectedDriverIdQty>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisExpectedDriverIdQty.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisExpectedDriverIdQty.getTableName(),
	}),

	expected_start_time: new BatchWriter<RideAnalysisExpectedStartTime>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisExpectedStartTime.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisExpectedStartTime.getTableName(),
	}),

	expected_vehicle_event_coverage_geo: new BatchWriter<RideAnalysisExpectedVehicleEventCoverageGeo>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisExpectedVehicleEventCoverageGeo.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisExpectedVehicleEventCoverageGeo.getTableName(),
	}),

	expected_vehicle_event_delay: new BatchWriter<RideAnalysisExpectedVehicleEventDelay>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisExpectedVehicleEventDelay.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisExpectedVehicleEventDelay.getTableName(),
	}),

	expected_vehicle_event_interval: new BatchWriter<RideAnalysisExpectedVehicleEventInterval>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisExpectedVehicleEventInterval.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisExpectedVehicleEventInterval.getTableName(),
	}),

	expected_vehicle_event_qty: new BatchWriter<RideAnalysisExpectedVehicleEventQty>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisExpectedVehicleEventQty.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisExpectedVehicleEventQty.getTableName(),
	}),

	expected_vehicle_id_qty: new BatchWriter<RideAnalysisExpectedVehicleIdQty>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisExpectedVehicleIdQty.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisExpectedVehicleIdQty.getTableName(),
	}),

	matching_apex_locations: new BatchWriter<RideAnalysisMatchingApexLocations>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisMatchingApexLocations.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisMatchingApexLocations.getTableName(),
	}),

	matching_vehicle_ids: new BatchWriter<RideAnalysisMatchingVehicleIds>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisMatchingVehicleIds.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisMatchingVehicleIds.getTableName(),
	}),

	rides: new BatchWriter<Ride>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rides.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rides.getTableName(),
	}),

	simple_one_apex_validation: new BatchWriter<RideAnalysisSimpleOneApexValidation>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisSimpleOneApexValidation.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisSimpleOneApexValidation.getTableName(),
	}),

	simple_one_vehicle_event_or_apex_validation: new BatchWriter<RideAnalysisSimpleOneVehicleEventOrApexValidation>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisSimpleOneVehicleEventOrApexValidation.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisSimpleOneVehicleEventOrApexValidation.getTableName(),
	}),

	simple_three_vehicle_events: new BatchWriter<RideAnalysisSimpleThreeVehicleEvents>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisSimpleThreeVehicleEvents.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisSimpleThreeVehicleEvents.getTableName(),
	}),

	transaction_sequentiality: new BatchWriter<RideAnalysisTransactionSequentiality>({
		batch_size: 1_000,
		batch_timeout: 60_000,
		insertFn: async (data) => {
			await labDb.operation.rideAnalysisTransactionSequentiality.insert('JSONEachRow', data);
		},
		title: await labDb.operation.rideAnalysisTransactionSequentiality.getTableName(),
	}),

};
