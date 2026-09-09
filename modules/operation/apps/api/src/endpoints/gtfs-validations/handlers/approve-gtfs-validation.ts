/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { getPlanHash } from '@tmlmobilidade/go-operation-pckg-utils';
import { storageProvider } from '@tmlmobilidade/go-providers-storage';
import { type CreatePlanDto, type Plan } from '@tmlmobilidade/go-types-operation';
import { hasPermissionResource } from '@tmlmobilidade/go-types-permissions';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/**
 * Approves a GTFS validation, creating a new plan from it.
 * @param request Fastify request containing the validation ID to approve
 * @param reply Fastify reply
 */
export async function approveGtfsValidationHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply<Plan>) {
	//

	//
	// Get the validation data

	const validationData = await goDb.operation.gtfsValidations.findById(request.params.id);

	//
	// Check if have permissions to create the plan

	const hasPermissionCreatePlan = hasPermissionResource(request.permissions, {
		requiredPermission: { action: 'create', scope: 'plans' },
		requiredValue: validationData.agency_id,
		resourceKey: 'agency_ids',
	});

	if (!hasPermissionCreatePlan) {
		return sendErrorApiResponse(reply, {
			error: 'You are not authorized to create this plan.',
			status_code: '403',
		});
	}

	//
	// Create the new plan data

	const newPlanData: CreatePlanDto = {
		active_from: validationData.gtfs_feed_info.feed_start_date,
		active_until: validationData.gtfs_feed_info.feed_end_date,
		agency_id: validationData.agency_id,
		apps: {
			hub_publish_gtfs: {
				message: null,
				status: 'waiting',
				timestamp: null,
			},
			hub_publish_gtfs_cm: {
				last_hash: null,
				message: null,
				metadata_hash: null,
				status: 'waiting',
				timestamp: null,
			},
			organizer: {
				last_hash: null,
				message: null,
				metadata_hash: null,
				status: 'waiting',
				timestamp: null,
			},
			rides_feeder: {
				last_hash: null,
				message: null,
				status: 'waiting',
				timestamp: null,
			},
		},
		attachments: {
			apex_config: null,
			operation_gtfs: null,
			operation_gtfs_normalized: null,
		},
		created_at: Dates.now('utc').unix_milliseconds,
		created_by: request.me._id,
		hash: '',
		is_locked: false,
	};

	//
	// Insert the new plan data

	const insertPlanResult = await goDb.operation.plans.insertOne(newPlanData);

	console.log(`[approveGtfsValidationHandler()] Inserted plan with ID "${insertPlanResult._id}"`);

	//
	// Copy validation GTFS into the plan scope, then attach it to the plan.
	// Failure modes (handled by storage saga + hooks):
	// - copy fails → saga compensates blob/metadata; onRollback deletes the plan
	// - plan update fails → onSuccess throws → onRollback deletes the plan → saga compensates the copy

	const copyResult = await storageProvider.copy(validationData.file_id, 'plans', insertPlanResult._id, {
		onRollback: async () => {
			await goDb.operation.plans.deleteById(insertPlanResult._id);
			throw new Error('Failed to copy validation GTFS into the plan scope');
		},
		onSuccess: async (_, result, session) => {
			// Update the plan in the database with the operation GTFS attachment ID
			const plansCollection = await goDb.operation.plans.getCollection();
			await plansCollection.updateOne(
				{ _id: insertPlanResult._id },
				{ $set: { 'attachments.operation_gtfs': result._id } },
				{ session },
			);
		},
	});

	console.log(`[approveGtfsValidationHandler()] Created a copy of the validation GTFS into the plan scope. Attachment ID: ${copyResult._id}`);

	//
	// Get a new hash for this plan

	const createdPlanData = await goDb.operation.plans.findById(insertPlanResult._id);

	if (!createdPlanData) {
		return sendErrorApiResponse(reply, {
			error: `Plan with ID "${insertPlanResult._id}" not found after creating the plan.`,
			status_code: '404',
		});
	}

	console.log(`[approveGtfsValidationHandler()] Found the created plan with ID "${createdPlanData._id}" and operation GTFS attachment ID "${createdPlanData.attachments.operation_gtfs}"`);

	const hashValue = await getPlanHash({
		activeFrom: createdPlanData.active_from,
		activeUntil: createdPlanData.active_until,
		operationGtfsAttachmentId: createdPlanData.attachments.operation_gtfs,
		operationGtfsNormalizedAttachmentId: createdPlanData.attachments.operation_gtfs_normalized,
		planId: createdPlanData._id,
	});

	const updatePlanHashResult = await goDb.operation.plans.updateById(createdPlanData._id, { hash: hashValue });

	console.log(`[approveGtfsValidationHandler()] Updated the plan hash with value "${hashValue}"`);

	//
	// Return the success response

	return sendSuccessApiResponse(reply, updatePlanHashResult);
}
