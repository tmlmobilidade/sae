/* * */

import { LatitudeSchema, LongitudeSchema } from '@tmlmobilidade/go-types-geo';
import { DegreesSchema, NonNegativeIntegerSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const GtfsRtPositionSchema = z.object({
	bearing: DegreesSchema.nullish(),
	latitude: LatitudeSchema,
	longitude: LongitudeSchema,
	odometer: NonNegativeIntegerSchema.nullish(),
	speed: NonNegativeIntegerSchema.nullish(),
});

export type GtfsRtPosition = z.infer<typeof GtfsRtPositionSchema>;
