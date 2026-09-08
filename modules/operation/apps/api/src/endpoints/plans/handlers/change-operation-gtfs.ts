/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { getPlanHash } from '@tmlmobilidade/go-operation-pckg-utils';
import { storageProvider } from '@tmlmobilidade/go-providers-storage';
import { type Plan } from '@tmlmobilidade/go-types-operation';
import { hasPermissionResource } from '@tmlmobilidade/go-types-permissions';

/**
 * Change the operation GTFS of a plan from a given validation ID.
 * @param request Fastify request containing plan ID in params and update data in body
 * @param reply Fastify reply
 */
export async function changeOperationGtfsHandler(request: FastifyRequest<{ Body: { validation_id: string }, Params: { id: string } }>, reply: FastifyReply<Plan>) {
	//

	//
	// Get the Plan from the database

	const planData = await goDb.operation.plans.findById(request.params.id);

	if (!planData) {
		return sendErrorApiResponse(reply, {
			error: `Plan with ID ${request.params.id} not found`,
			status_code: '404',
		});
	}

	//
	// Check if the user has permission to change the GTFS of the Plan

	const hasPermissionChangeGtfsPlan = hasPermissionResource(request.permissions, {
		requiredPermission: { action: 'update_gtfs_plan', scope: 'plans' },
		requiredValue: planData.agency_id,
		resourceKey: 'agency_ids',
	});

	if (!hasPermissionChangeGtfsPlan) {
		return sendErrorApiResponse(reply, {
			error: 'You are not authorized to change the GTFS of the plan.',
			status_code: '403',
		});
	}

	//
	// For a given validation ID, get the validation data

	const validationData = await goDb.operation.gtfsValidations.findById(request.body.validation_id);

	if (!validationData) {
		return sendErrorApiResponse(reply, {
			error: `GTFS Validation with ID "${request.body.validation_id}" not found.`,
			status_code: '404',
		});
	}

	//
	// Copy validation GTFS into the plan scope, then point the plan at it and drop the old file.
	// Failure modes (handled by storage saga + hooks):
	// - copy fails → saga compensates blob/metadata; plan untouched
	// - plan update fails → onSuccess throws → saga compensates the copy
	// - old-file delete fails → onSuccess throws → onRollback restores plan → saga compensates the copy

	await storageProvider.copy(validationData.file_id, 'plans', planData._id, {
		onSuccess: async (_, result) => {
			// Get a new hash for this plan
			const hashValue = await getPlanHash({
				activeFrom: planData.active_from,
				activeUntil: planData.active_until,
				operationGtfsAttachmentId: result._id,
				operationGtfsNormalizedAttachmentId: planData.attachments.operation_gtfs_normalized,
				planId: planData._id,
			});
			// Update the plan in the database
			const plansCollection = await goDb.operation.plans.getCollection();
			await plansCollection.updateOne({ _id: planData._id }, {
				$set: {
					'attachments.operation_gtfs': result._id,
					'hash': hashValue,
				},
			});
			// Delete the old operation GTFS file
			await storageProvider.delete(planData.attachments.operation_gtfs);
		},
	});

	//
	// Send the updated plan data as the response

	const updatedPlanData = await goDb.operation.plans.findById(planData._id);

	if (!updatedPlanData) {
		return sendErrorApiResponse(reply, {
			error: `Plan with ID "${planData._id}" not found after updating the operation file.`,
			status_code: '404',
		});
	}

	return sendSuccessApiResponse(reply, updatedPlanData);
}
