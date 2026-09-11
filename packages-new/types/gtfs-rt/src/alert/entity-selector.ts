/* * */

import { GtfsTripDirectionSchema } from '@tmlmobilidade/go-types-gtfs';
import { z } from 'zod';

import { GtfsRtTripDescriptorSchema } from '../shared/trip-descriptor.js';

/* * */

export const GtfsRtEntitySelectorSchema = z.object({
	agency_id: z.string().nullish(),
	direction_id: GtfsTripDirectionSchema.nullish(),
	route_id: z.string().nullish(),
	route_type: z.number().nullish(),
	stop_id: z.string().nullish(),
	trip: GtfsRtTripDescriptorSchema.nullish(),
});

export type GtfsRtEntitySelector = z.infer<typeof GtfsRtEntitySelectorSchema>;
