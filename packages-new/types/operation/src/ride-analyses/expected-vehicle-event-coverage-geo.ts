/* * */

import { RideAnalysisBaseSchema } from '@/ride-analyses/ride-analysis-base.js';
import { NonNegativeIntegerSchema, PercentSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const RideAnalysisExpectedVehicleEventCoverageGeoSchema = RideAnalysisBaseSchema.extend({
	reason: z.enum(['NO_PATH_DATA', 'NO_VEHICLE_EVENTS', 'LESS_THAN_90_PCT_COVERAGE', '90_PCT_OR_MORE_COVERAGE']).nullable().default(null),
	stops_coverage_absolute: NonNegativeIntegerSchema.nullable().default(null),
	stops_coverage_percentage: PercentSchema.nullable().default(null),
});

/**
 * Tests whether at least 90% of all stops are covered by at least one vehicle event,
 * using the GPS coordinates of the vehicle events and the geofences of the stops.
 * @param total_stops_qty The number of stops that are expected to be covered by at least one vehicle event.
 * @param covered_stops_qty The number of stops that are covered by at least one vehicle event.
 * @param covered_stops_percentage The percentage of stops that are covered by at least one vehicle event.
 */
export type RideAnalysisExpectedVehicleEventCoverageGeo = z.infer<typeof RideAnalysisExpectedVehicleEventCoverageGeoSchema>;
