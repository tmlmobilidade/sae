/* * */

import { z } from 'zod';

import { RideSchema } from './ride.js';

/* * */

export const SimplifiedRideSchema = RideSchema.omit({ analyses: true });

/**
 * A Simplified Ride is a tabular representation of a ride, without its analyses.
 * It is used to store the ride data in a tabular format for easy querying and analysis.
 */
export type SimplifiedRide = z.infer<typeof SimplifiedRideSchema>;
