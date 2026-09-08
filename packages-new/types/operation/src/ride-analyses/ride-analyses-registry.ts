/* * */

import { z } from 'zod';

import { RideAnalysisAtLeastOneVehicleEventOnFirstStopSchema } from './at-least-one-vehicle-event-on-first-stop.js';
import { RideAnalysisAtLeastOneVehicleEventOnLastStopSchema } from './at-least-one-vehicle-event-on-last-stop.js';
import { RideAnalysisExpectedApexValidationIntervalSchema } from './expected-apex-validation-interval.js';
import { RideAnalysisExpectedDriverIdQtySchema } from './expected-driver-id-qty.js';
import { RideAnalysisExpectedStartTimeSchema } from './expected-start-time.js';
import { RideAnalysisExpectedVehicleEventCoverageGeoSchema } from './expected-vehicle-event-coverage-geo.js';
import { RideAnalysisExpectedVehicleEventDelaySchema } from './expected-vehicle-event-delay.js';
import { RideAnalysisExpectedVehicleEventIntervalSchema } from './expected-vehicle-event-interval.js';
import { RideAnalysisExpectedVehicleEventQtySchema } from './expected-vehicle-event-qty.js';
import { RideAnalysisExpectedVehicleIdQtySchema } from './expected-vehicle-id-qty.js';
import { RideAnalysisMatchingApexLocationsSchema } from './matching-apex-locations.js';
import { RideAnalysisMatchingVehicleIdsSchema } from './matching-vehicle-ids.js';
import { RideAnalysisSimpleOneApexValidationSchema } from './simple-one-apex-validation.js';
import { RideAnalysisSimpleOneVehicleEventOrApexValidationSchema } from './simple-one-vehicle-event-or-apex-validation.js';
import { RideAnalysisSimpleThreeVehicleEventsSchema } from './simple-three-vehicle-events.js';
import { RideAnalysisTransactionSequentialitySchema } from './transaction-sequentiality.js';

/* * */

export const RideAnalysesRegistrySchema = z.object({
	at_least_one_vehicle_event_on_first_stop: RideAnalysisAtLeastOneVehicleEventOnFirstStopSchema.nullable().default(null),
	at_least_one_vehicle_event_on_last_stop: RideAnalysisAtLeastOneVehicleEventOnLastStopSchema.nullable().default(null),
	expected_apex_validation_interval: RideAnalysisExpectedApexValidationIntervalSchema.nullable().default(null),
	expected_driver_id_qty: RideAnalysisExpectedDriverIdQtySchema.nullable().default(null),
	expected_start_time: RideAnalysisExpectedStartTimeSchema.nullable().default(null),
	expected_vehicle_event_coverage_geo: RideAnalysisExpectedVehicleEventCoverageGeoSchema.nullable().default(null),
	expected_vehicle_event_delay: RideAnalysisExpectedVehicleEventDelaySchema.nullable().default(null),
	expected_vehicle_event_interval: RideAnalysisExpectedVehicleEventIntervalSchema.nullable().default(null),
	expected_vehicle_event_qty: RideAnalysisExpectedVehicleEventQtySchema.nullable().default(null),
	expected_vehicle_id_qty: RideAnalysisExpectedVehicleIdQtySchema.nullable().default(null),
	matching_apex_locations: RideAnalysisMatchingApexLocationsSchema.nullable().default(null),
	matching_vehicle_ids: RideAnalysisMatchingVehicleIdsSchema.nullable().default(null),
	simple_one_apex_validation: RideAnalysisSimpleOneApexValidationSchema.nullable().default(null),
	simple_one_vehicle_event_or_apex_validation: RideAnalysisSimpleOneVehicleEventOrApexValidationSchema.nullable().default(null),
	simple_three_vehicle_events: RideAnalysisSimpleThreeVehicleEventsSchema.nullable().default(null),
	transaction_sequentiality: RideAnalysisTransactionSequentialitySchema.nullable().default(null),
});

/**
 * The registry of ride analyses.
 */
export type RideAnalysesRegistry = z.infer<typeof RideAnalysesRegistrySchema>;
