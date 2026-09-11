/* * */

import { UnixSecondsSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

import { GtfsRtTripDescriptorSchema } from '../shared/trip-descriptor.js';
import { GtfsRtVehicleDescriptorSchema } from '../shared/vehicle-descriptor.js';
import { GtfsRtStopTimeUpdateSchema } from './stop-time-update.js';
import { GtfsRtTripPropertiesSchema } from './trip-properties.js';

/* * */

export const GtfsRtTripUpdateSchema = z.object({
	delay: z.number().nullish(),
	stop_time_update: z.array(GtfsRtStopTimeUpdateSchema).nullish(),
	timestamp: UnixSecondsSchema.nullish(),
	trip: GtfsRtTripDescriptorSchema,
	trip_properties: GtfsRtTripPropertiesSchema.nullish(),
	vehicle: GtfsRtVehicleDescriptorSchema,
});

export type GtfsRtTripUpdate = z.infer<typeof GtfsRtTripUpdateSchema>;
