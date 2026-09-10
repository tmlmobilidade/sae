/* * */

import { NonNegativeIntegerSchema, PercentSchema, UnixSecondsSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

import { GtfsRtOccupancyStatusSchema } from '../shared/occupancy-status.js';
import { GtfsRtTripDescriptorSchema } from '../shared/trip-descriptor.js';
import { GtfsRtVehicleDescriptorSchema } from '../shared/vehicle-descriptor.js';
import { GtfsRtCarriageDetailsSchema } from './carriage-details.js';
import { GtfsRtCongestionLevelSchema } from './congestion-level.js';
import { GtfsRtPositionSchema } from './position.js';
import { GtfsRtVehicleStopStatusSchema } from './vehicle-stop-status.js';

/* * */

export const GtfsRtVehiclePositionSchema = z.object({
	congestion_level: GtfsRtCongestionLevelSchema.nullish(),
	current_status: GtfsRtVehicleStopStatusSchema.nullish(),
	current_stop_sequence: NonNegativeIntegerSchema.nullish(),
	multi_carriage_details: GtfsRtCarriageDetailsSchema.array().nullish(),
	occupancy_percentage: PercentSchema.nullish(),
	occupancy_status: GtfsRtOccupancyStatusSchema.nullish(),
	position: GtfsRtPositionSchema,
	stop_id: z.string().nullish(),
	timestamp: UnixSecondsSchema,
	trip: GtfsRtTripDescriptorSchema,
	vehicle: GtfsRtVehicleDescriptorSchema,
});

export type GtfsRtVehiclePosition = z.infer<typeof GtfsRtVehiclePositionSchema>;
