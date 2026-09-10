/* * */

import { NonNegativeIntegerSchema, PercentSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

import { GtfsRtOccupancyStatusSchema } from '../shared/occupancy-status.js';

/* * */

export const GtfsRtCarriageDetailsSchema = z.object({
	carriage_sequence: NonNegativeIntegerSchema,
	id: z.string().nullish(),
	label: z.string().nullish(),
	occupancy_percentage: PercentSchema.nullish(),
	occupancy_status: GtfsRtOccupancyStatusSchema.nullish(),
});

export type GtfsRtCarriageDetails = z.infer<typeof GtfsRtCarriageDetailsSchema>;
