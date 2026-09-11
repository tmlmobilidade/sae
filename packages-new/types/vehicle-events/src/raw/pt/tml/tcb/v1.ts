/* * */

import { GtfsTripDirectionSchema } from '@tmlmobilidade/go-types-gtfs';
import { GtfsRtOccupancyStatusSchema } from '@tmlmobilidade/go-types-gtfs-rt';
import { OperationalDateIntSchema, OperationalTimeSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

import { RawVehicleEventBaseSchema } from '../../../raw-vehicle-event-base.js';

/* * */

export const RawVehicleEventPtTmlTcbV1PayloadSchema = z.object({
	header: z.object({
		feed_version: z.string().nullish(),
		gtfs_realtime_version: z.string(),
		incrementality: z.literal('FULL_DATASET').nullish(),
		timestamp: z.number(),
	}),
	vehicle: z.object({
		current_status: z.enum(['INCOMING_AT', 'STOPPED_AT', 'IN_TRANSIT_TO']).nullish(),
		current_stop_sequence: z.number().nullish(),
		occupancy_status: GtfsRtOccupancyStatusSchema.nullish(),
		position: z.object({
			bearing: z.number().nullish(),
			latitude: z.number(),
			longitude: z.number(),
			speed: z.number().nullish(),
		}),
		stop_id: z.string().nullish(),
		timestamp: z.number().nullish(),
		trip: z.object({
			direction_id: GtfsTripDirectionSchema.nullish(),
			route_id: z.string(),
			start_date: OperationalDateIntSchema.nullish(),
			start_time: OperationalTimeSchema.nullish(),
			trip_id: z.string(),
		}),
		vehicle: z.object({
			id: z.string(),
		}),
	}),
});

export type RawVehicleEventPtTmlTcbV1Payload = z.infer<typeof RawVehicleEventPtTmlTcbV1PayloadSchema>;

/* * */

export const RawVehicleEventPtTmlTcbV1Schema = RawVehicleEventBaseSchema.extend({
	agency_id: z.literal('A3H3M'),
	payload: RawVehicleEventPtTmlTcbV1PayloadSchema,
	version: z.literal('pt-tml-tcb-v1'),
});

export type RawVehicleEventPtTmlTcbV1 = z.infer<typeof RawVehicleEventPtTmlTcbV1Schema>;
