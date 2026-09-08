/* * */

import { type HashableRide, HashableRideSchema, type Ride, type RideHash, RideHashSchema } from '@tmlmobilidade/go-types-operation';
import { createHash } from 'node:crypto';

/**
 * Returns a SHA-256 hash of the hashable ride object.
 * @param rideData The hashable ride data to hash or the full ride object itself.
 * @returns The hash value of the ride.
 */
export function getRideHash(rideData: HashableRide | Ride): RideHash {
	//

	//
	// Validate the hashable ride object

	const hashableRide = HashableRideSchema.parse(rideData);

	//
	// Create the hash

	const hashValue = createHash('sha256')
		.update(JSON.stringify(hashableRide))
		.digest('hex');

	return RideHashSchema.parse(hashValue);
}
