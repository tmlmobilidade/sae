/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type Ride, RideAnalysisAtLeastOneVehicleEventOnFirstStop, RideAnalysisAtLeastOneVehicleEventOnLastStop, RideAnalysisExpectedApexValidationInterval, RideAnalysisExpectedDriverIdQty, RideAnalysisExpectedStartTime, RideAnalysisExpectedVehicleEventDelay, RideAnalysisExpectedVehicleEventInterval, RideAnalysisExpectedVehicleEventQty, RideAnalysisExpectedVehicleIdQty, RideAnalysisMatchingApexLocations, RideAnalysisMatchingVehicleIds, RideAnalysisSimpleOneApexValidation, RideAnalysisSimpleOneVehicleEventOrApexValidation, RideAnalysisSimpleThreeVehicleEvents, RideAnalysisTransactionSequentiality } from '@tmlmobilidade/go-types-operation';
import { BatchWriter } from '@tmlmobilidade/go-utils-exec';

/* * */

export const ridesWriter = new BatchWriter<Ride>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rides.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rides.getTableName(),
});

/* * */

export const rideAnalysisAtLeastOneVehicleEventOnFirstStopWriter = new BatchWriter<RideAnalysisAtLeastOneVehicleEventOnFirstStop>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisAtLeastOneVehicleEventOnFirstStop.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisAtLeastOneVehicleEventOnFirstStop.getTableName(),
});

/* * */

export const rideAnalysisAtLeastOneVehicleEventOnLastStopWriter = new BatchWriter<RideAnalysisAtLeastOneVehicleEventOnLastStop>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisAtLeastOneVehicleEventOnLastStop.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisAtLeastOneVehicleEventOnLastStop.getTableName(),
});

/* * */

export const rideAnalysisExpectedApexValidationIntervalWriter = new BatchWriter<RideAnalysisExpectedApexValidationInterval>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisExpectedApexValidationInterval.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisExpectedApexValidationInterval.getTableName(),
});

/* * */

export const rideAnalysisExpectedDriverIdQtyWriter = new BatchWriter<RideAnalysisExpectedDriverIdQty>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisExpectedDriverIdQty.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisExpectedDriverIdQty.getTableName(),
});

/* * */

export const rideAnalysisExpectedStartTimeWriter = new BatchWriter<RideAnalysisExpectedStartTime>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisExpectedStartTime.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisExpectedStartTime.getTableName(),
});

/* * */

export const rideAnalysisExpectedVehicleEventDelayWriter = new BatchWriter<RideAnalysisExpectedVehicleEventDelay>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisExpectedVehicleEventDelay.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisExpectedVehicleEventDelay.getTableName(),
});

/* * */

export const rideAnalysisExpectedVehicleEventIntervalWriter = new BatchWriter<RideAnalysisExpectedVehicleEventInterval>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisExpectedVehicleEventInterval.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisExpectedVehicleEventInterval.getTableName(),
});

/* * */

export const rideAnalysisExpectedVehicleEventQtyWriter = new BatchWriter<RideAnalysisExpectedVehicleEventQty>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisExpectedVehicleEventQty.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisExpectedVehicleEventQty.getTableName(),
});

/* * */

export const rideAnalysisExpectedVehicleIdQtyWriter = new BatchWriter<RideAnalysisExpectedVehicleIdQty>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisExpectedVehicleIdQty.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisExpectedVehicleIdQty.getTableName(),
});

/* * */

export const rideAnalysisMatchingApexLocationsWriter = new BatchWriter<RideAnalysisMatchingApexLocations>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisMatchingApexLocations.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisMatchingApexLocations.getTableName(),
});

/* * */

export const rideAnalysisMatchingVehicleIdsWriter = new BatchWriter<RideAnalysisMatchingVehicleIds>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisMatchingVehicleIds.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisMatchingVehicleIds.getTableName(),
});

/* * */

export const rideAnalysisSimpleOneApexValidationWriter = new BatchWriter<RideAnalysisSimpleOneApexValidation>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisSimpleOneApexValidation.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisSimpleOneApexValidation.getTableName(),
});

/* * */

export const rideAnalysisSimpleOneVehicleEventOrApexValidationWriter = new BatchWriter<RideAnalysisSimpleOneVehicleEventOrApexValidation>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisSimpleOneVehicleEventOrApexValidation.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisSimpleOneVehicleEventOrApexValidation.getTableName(),
});

/* * */

export const rideAnalysisSimpleThreeVehicleEventsWriter = new BatchWriter<RideAnalysisSimpleThreeVehicleEvents>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisSimpleThreeVehicleEvents.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisSimpleThreeVehicleEvents.getTableName(),
});

/* * */

export const rideAnalysisTransactionSequentialityWriter = new BatchWriter<RideAnalysisTransactionSequentiality>({
	batch_size: 10_000,
	// batch_timeout: 20_000,
	insertFn: async (data) => {
		await labDb.operation.rideAnalysisTransactionSequentiality.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rideAnalysisTransactionSequentiality.getTableName(),
});
