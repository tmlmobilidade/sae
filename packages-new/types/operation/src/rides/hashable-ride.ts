/* * */

import { z } from 'zod';

import { RideSchema } from './ride.js';

/* * */

export const HashableRideSchema = RideSchema.omit({
	hash: true,
});

export type HashableRide = z.infer<typeof HashableRideSchema>;
