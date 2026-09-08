/* * */

import { z } from 'zod';

/* * */

export const RideHashSchema = z.string().brand('RideHash');

/**
 * A RideHash is a SHA-256 hash of a ride.
 * It is used to identify a ride uniquely and efficiently.
 */
export type RideHash = z.infer<typeof RideHashSchema>;
