/* * */

import { GtfsTripDirectionSchema } from '@tmlmobilidade/go-types-gtfs';
import { OperationalDateIntSchema, OperationalTimeSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

import { GtfsRtScheduleRelationshipSchema } from './schedule-relationship.js';

/* * */

export const GtfsRtTripDescriptorSchema = z.object({
	direction_id: GtfsTripDirectionSchema.nullish(),
	modified_trip: z.any(),
	route_id: z.string(),
	schedule_relationship: GtfsRtScheduleRelationshipSchema.nullish(),
	start_date: OperationalDateIntSchema,
	start_time: OperationalTimeSchema.nullish(),
	trip_id: z.string(),
});

export type GtfsRtTripDescriptor = z.infer<typeof GtfsRtTripDescriptorSchema>;
