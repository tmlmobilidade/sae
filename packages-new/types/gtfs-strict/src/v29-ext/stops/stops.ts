/* * */

import { LatitudeSchema, LongitudeSchema } from '@tmlmobilidade/go-types-geo';
import { GtfsLocationTypeSchema, GtfsTernarySchema } from '@tmlmobilidade/go-types-gtfs';
import { z } from 'zod';

/* * */

export const GtfsStrictV29ExtStopsSchema = z.object({
	level_id: z.string().optional(),
	location_type: GtfsLocationTypeSchema,
	parent_station: z.string().optional(),
	platform_code: z.string().optional(),
	stop_code: z.string(),
	stop_desc: z.string().optional(),
	stop_id: z.string(),
	stop_lat: LatitudeSchema,
	stop_lon: LongitudeSchema,
	stop_name: z.string(),
	stop_timezone: z.string().optional(),
	stop_url: z.string().optional(),
	wheelchair_boarding: GtfsTernarySchema.optional(),
	zone_id: z.string().optional(),
});

/**
 * Represents a stop in the GTFS format.
 * A stop is a physical location where passengers can board or alight from a transit vehicle.
 * It includes information such as the stop ID, name, location, and type of service.
 */
export type GtfsStrictV29ExtStops = z.infer<typeof GtfsStrictV29ExtStopsSchema>;
