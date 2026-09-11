/* * */

import { LatitudeSchema, LongitudeSchema } from '@tmlmobilidade/go-types-geo';
import { GtfsTripDirectionSchema } from '@tmlmobilidade/go-types-gtfs';
import { GtfsRtVehicleStopStatusSchema } from '@tmlmobilidade/go-types-gtfs-rt';
import { CalendarDateSchema, DegreesSchema, NonNegativeIntegerSchema, OperationalDateIntSchema, UnixMillisecondsSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const HubV1ApiVehiclePositionSchema = z.object({
	_id: z.string(),
	agency_id: z.string(),
	bearing: DegreesSchema.nullable().default(null),
	bearing_method: z.enum(['measured', 'inferred', 'kept_prev_value', 'skipped']).default('skipped'),
	calendar_date: CalendarDateSchema,
	created_at: UnixMillisecondsSchema,
	current_status: GtfsRtVehicleStopStatusSchema.nullable().default(null),
	direction_id: GtfsTripDirectionSchema.nullable().default(null),
	geohash: z.string().nullable().default(null),
	latitude: LatitudeSchema,
	license_plate: z.string().nullable().default(null),
	longitude: LongitudeSchema,
	operational_date: OperationalDateIntSchema,
	pattern_id: z.string().nullable().default(null),
	received_at: UnixMillisecondsSchema,
	ride_id: z.string().nullable().default(null),
	route_id: z.string().nullable().default(null),
	route_short_name: z.string().nullable().default(null),
	shape_id: z.string().nullable().default(null),
	speed: NonNegativeIntegerSchema.nullable().default(null),
	stop_id: z.string().nullable().default(null),
	trip_id: z.string(),
	vehicle_id: z.string(),
});

/**
 * Vehicle Position item for the Hub V1 Realtime API.
 */
export type HubV1ApiVehiclePosition = z.infer<typeof HubV1ApiVehiclePositionSchema>;

