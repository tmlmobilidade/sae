/* * */

import { VehiclePropulsionSchema, VehicleTypeSchema } from '@tmlmobilidade/go-types-operation';
import { NonNegativeIntegerSchema, OperationalDateIntSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const HubV1ApiVehicleMetadataSchema = z.object({
	_id: z.string(),
	agency_id: z.string(),
	available_seats: NonNegativeIntegerSchema.nullable().default(null),
	contactless: z.boolean().default(false),
	license_plate: z.string(),
	make: z.string(),
	model: z.string(),
	propulsion: VehiclePropulsionSchema.nullable().default(null),
	registration_date: OperationalDateIntSchema.nullable().default(null),
	vehicle_id: z.string(),
	vehicle_type: VehicleTypeSchema.nullable().default(null),
	wheelchair: z.boolean().default(false),
});

/**
 * Vehicle Metadata item for the Hub V1 Realtime API.
 */
export type HubV1ApiVehicleMetadata = z.infer<typeof HubV1ApiVehicleMetadataSchema>;

