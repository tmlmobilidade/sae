/* * */

import { BaseDocumentSchema, OperationalDateSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

import { VehicleEmissionSchema } from './emission.js';
import { VehiclePropulsionSchema } from './propulsion.js';
import { VehicleTypeSchema } from './typology.js';

/* * */

export const vehicleSchema = BaseDocumentSchema.extend({
	// Vehicle identification
	agency_id: z.string(),
	license_plate: z.string(),
	make: z.string(),
	model: z.string(),
	owner: z.string(),
	registration_date: OperationalDateSchema,
	start_date: OperationalDateSchema,
	vehicle_id: z.string(),

	// Vehicle specifications
	available_seats: z.number().nullable().default(null),
	available_standing: z.number().nullable().default(null),
	emission: VehicleEmissionSchema.nullable().default(null),
	propulsion: VehiclePropulsionSchema.nullable().default(null),
	typology: VehicleTypeSchema.nullable().default(null),

	// Vehicle functionalities
	bicycles: z.boolean().default(false),
	climatization: z.boolean().default(false),
	consumption_meter: z.boolean().default(false),
	contactless: z.boolean().default(false),
	corridor: z.boolean().default(false),
	external_sound: z.boolean().default(false),
	folding_system: z.boolean().default(false),
	front_display: z.boolean().default(false),
	internal_sound: z.boolean().default(false),
	kneeling: z.boolean().default(false),
	lowered_floor: z.boolean().default(false),
	onboard_monitor: z.boolean().default(false),
	passenger_counting: z.boolean().default(false),
	ramp: z.boolean().default(false),
	rear_display: z.boolean().default(false),
	side_display: z.boolean().default(false),
	static_information: z.boolean().default(false),
	wheelchair: z.boolean().default(false),
});

export const CreateVehicleSchema = vehicleSchema.omit({ created_at: true, updated_at: true });
export const UpdateVehicleSchema = CreateVehicleSchema.omit({ created_by: true }).partial();

/* * */

export type Vehicle = z.infer<typeof vehicleSchema>;
export type CreateVehicleDto = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleDto = z.infer<typeof UpdateVehicleSchema>;
