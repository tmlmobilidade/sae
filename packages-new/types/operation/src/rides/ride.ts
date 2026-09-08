/* * */

import { GtfsTripDirectionSchema } from '@tmlmobilidade/go-types-gtfs';
import { HexColorSchema, NonNegativeIntegerSchema, OperationalDateIntSchema, ProcessingStatusSchema, TimezoneIdentifiedSchema, UnixMillisecondsSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

import { RideAnalysesRegistrySchema } from '../ride-analyses/ride-analyses-registry.js';
import { RideHashSchema } from './ride-hash.js';

/* * */

export const RideIdentitySchema = z.object({
	_id: z.string(),
	agency_code: z.string(),
	agency_id: z.string(),
	direction_id: GtfsTripDirectionSchema,
	hash: RideHashSchema,
	hashed_shape_id: z.string(),
	hashed_trip_id: z.string(),
	headsign: z.string(),
	operational_date: OperationalDateIntSchema,
	plan_id: z.string(),
	route_color: HexColorSchema.default('#000000'),
	route_id: z.string(),
	route_long_name: z.string(),
	route_short_name: z.string(),
	route_text_color: HexColorSchema.default('#FFFFFF'),
	shape_id: z.string(),
	timezone: TimezoneIdentifiedSchema,
	trip_id: z.string(),
});

export const RideScheduleSchema = z.object({
	end_time_observed: UnixMillisecondsSchema.nullable().default(null),
	end_time_scheduled: UnixMillisecondsSchema,
	extension_observed: NonNegativeIntegerSchema.nullable().default(null),
	extension_scheduled: NonNegativeIntegerSchema,
	start_time_observed: UnixMillisecondsSchema.nullable().default(null),
	start_time_scheduled: UnixMillisecondsSchema,
});

export const RideApexSchema = z.object({
	apex_banking_taps_amount: NonNegativeIntegerSchema.nullable().default(null),
	apex_banking_taps_qty: NonNegativeIntegerSchema.nullable().default(null),
	apex_locations_qty: NonNegativeIntegerSchema.nullable().default(null),
	apex_refunds_amount: NonNegativeIntegerSchema.nullable().default(null),
	apex_refunds_qty: NonNegativeIntegerSchema.nullable().default(null),
	apex_sales_amount: NonNegativeIntegerSchema.nullable().default(null),
	apex_sales_qty: NonNegativeIntegerSchema.nullable().default(null),
	apex_validations_qty: NonNegativeIntegerSchema.nullable().default(null),
});

export const RidePassengersSchema = z.object({
	passengers_estimated: NonNegativeIntegerSchema.nullable().default(null),
	passengers_observed: NonNegativeIntegerSchema.nullable().default(null),
	passengers_observed_banking_taps_amount: NonNegativeIntegerSchema.nullable().default(null),
	passengers_observed_banking_taps_qty: NonNegativeIntegerSchema.nullable().default(null),
	passengers_observed_prepaid_amount: NonNegativeIntegerSchema.nullable().default(null),
	passengers_observed_prepaid_qty: NonNegativeIntegerSchema.nullable().default(null),
	passengers_observed_sales_amount: NonNegativeIntegerSchema.nullable().default(null),
	passengers_observed_sales_qty: NonNegativeIntegerSchema.nullable().default(null),
	passengers_observed_subscription_qty: NonNegativeIntegerSchema.nullable().default(null),
});

export const RideOperationSchema = z.object({
	driver_ids: z.array(z.string()).default([]),
	seen_first_at: UnixMillisecondsSchema.nullable().default(null),
	seen_last_at: UnixMillisecondsSchema.nullable().default(null),
	vehicle_ids: z.array(z.string()).default([]),
});

export const RideLifecycleSchema = z.object({
	processing_status: ProcessingStatusSchema.default('waiting'),
	updated_at: UnixMillisecondsSchema,
});

export const RideAnalysesSchema = z.object({
	analyses: RideAnalysesRegistrySchema.nullable().default(null),
});

/* * */

export const RideSchema = RideIdentitySchema
	.merge(RideScheduleSchema)
	.merge(RideApexSchema)
	.merge(RidePassengersSchema)
	.merge(RideOperationSchema)
	.merge(RideLifecycleSchema)
	.merge(RideAnalysesSchema);

/**
 * A Ride represents a single vehicle journey on a single route for a single day.
 * It is the basic unit of analysis for the public transit system.
 */
export type Ride = z.infer<typeof RideSchema>;
