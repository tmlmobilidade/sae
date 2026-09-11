/* * */

import { z } from 'zod';

/* * */

export const VehiclePropulsionValues = [
	'gasoline',
	'diesel',
	'lpg_auto',
	'mixture',
	'biodiesel',
	'electricity',
	'hybrid',
	'natural_gas',
] as const;

export const VehiclePropulsionSchema = z
	.string()
	.transform(value => String(value).toLowerCase())
	.pipe(z.enum(VehiclePropulsionValues));

export type VehiclePropulsion = z.infer<typeof VehiclePropulsionSchema>;
