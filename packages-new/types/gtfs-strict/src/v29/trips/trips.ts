/* * */

import { GtfsTernarySchema, GtfsTripDirectionSchema } from '@tmlmobilidade/go-types-gtfs';
import { z } from 'zod';

/* * */

export const GtfsStrictV29TripsSchema = z.object({
	bikes_allowed: GtfsTernarySchema.optional(),
	block_id: z.string().optional(),
	calendar_desc: z.preprocess(value => value ?? '', z.string()),
	direction_id: GtfsTripDirectionSchema,
	pattern_id: z.string(),
	pattern_short_name: z.string(),
	route_id: z.string(),
	service_id: z.string(),
	shape_id: z.string(),
	trip_headsign: z.string(),
	trip_id: z.string(),
	wheelchair_accessible: GtfsTernarySchema.optional(),
});

/**
 * Represents a trip in the custom GTFS strict v1 format.
 * A trip is the definition of a service of a given route,
 * scheduled to run on specific dates (`service_id`) and times (`stop_times`).
 * It also includes the `calendar_desc`, `pattern_id`, and `pattern_short_name` fields.
 */
export type GtfsStrictV29Trips = z.infer<typeof GtfsStrictV29TripsSchema>;
