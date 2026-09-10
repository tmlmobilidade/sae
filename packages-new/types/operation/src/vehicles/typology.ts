/* * */

import { z } from 'zod';

/* * */

export const VehicleTypeValues = [
	'tram',
	'subway',
	'rail',
	'bus',
	'ferry',
	'cable_tram',
	'cable car',
	'funicular',
	'trolleybus',
	'monorail',
] as const;

export const VehicleTypeSchema = z
	.string()
	.transform(value => String(value).toLowerCase())
	.pipe(z.enum(VehicleTypeValues));

export type VehicleType = z.infer<typeof VehicleTypeSchema>;
