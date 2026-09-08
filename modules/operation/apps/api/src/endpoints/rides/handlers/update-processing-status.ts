/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type SimplifiedRide, SimplifiedRideSchema } from '@tmlmobilidade/go-types-operation';
import { hasPermissionResource } from '@tmlmobilidade/go-types-permissions';
import { type ProcessingStatus } from '@tmlmobilidade/go-types-shared';

/**
 * Update the processing status of a Ride.
 * @param request The Fastify request object.
 * @param reply The Fastify reply object.
 */
export async function updateProcessingStatusHandler(request: FastifyRequest<{ Body: { processing_status: ProcessingStatus }, Params: { id: string } }>, reply: FastifyReply<SimplifiedRide>) {
	//

	//
	// Retrieve the Ride from the database

	const rideData = await goDb.operation.rides.findById(request.params.id);

	if (!rideData) {
		return sendErrorApiResponse(reply, {
			error: `Ride with ID ${request.params.id} not found`,
			status_code: '404',
		});
	}

	//
	// Check if the user has permissions to update the processing status of the ride

	const hasPermissionUpdateProcessingStatus = hasPermissionResource(request.me.permissions, {
		requiredPermission: { action: 'analysis_reprocess', scope: 'rides' },
		requiredValue: rideData.agency_id,
		resourceKey: 'agency_ids',
	});

	if (!hasPermissionUpdateProcessingStatus) {
		return sendErrorApiResponse(reply, {
			error: 'You are not authorized to update the processing status of this ride.',
			status_code: '403',
		});
	}

	//
	// Update the Ride in goDb to 'waiting' status

	const updatedRideResult = await goDb.operation.rides.updateById(request.params.id, { processing_status: 'waiting' });

	//
	// Run the simplified schema to strip the analyses object from the Ride,
	// as the API receives data from labDb and not from goDb directly.

	const simplifiedRideData = SimplifiedRideSchema.parse(updatedRideResult);

	return sendSuccessApiResponse(reply, simplifiedRideData);
}
