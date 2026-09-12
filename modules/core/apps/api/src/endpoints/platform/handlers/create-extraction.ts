/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { AUTH_SESSION_COOKIE_NAME } from '@tmlmobilidade/go-providers-auth';
import { type Extraction, type ExtractionCreate, ExtractionCreateSchema } from '@tmlmobilidade/go-types-extractions';

/**
 * Create a new extraction for the current user.
 * @param request The request object
 * @param reply The reply object
 */
export async function createExtractionHandler(request: FastifyRequest<{ Body: ExtractionCreate }>, reply: FastifyReply<Extraction[]>) {
	//

	//
	// Extract the session token from authentication cookie

	const sessionToken = request.cookies[AUTH_SESSION_COOKIE_NAME];

	if (!sessionToken) {
		return sendErrorApiResponse(reply, {
			error: 'Session token not found',
			status_code: '401',
		});
	}

	//
	// Validate the request body

	const validatedRequestBody = ExtractionCreateSchema.parse(request.body);

	//
	// Insert a new extraction into the database

	await goDb.core.extractions.insertOne({
		...validatedRequestBody,
		attachment_id: null,
		created_by: request.me._id,
		downloaded_at: null,
		is_locked: false,
		processing_status: 'waiting',
		retries: 0,
	});

	//
	// Retrieve all extractions again for the current user
	// so the frontend is able to immediately mutate the extractions list

	const foundExtractions = await goDb.core.extractions.findMany({ created_by: request.me._id });

	sendSuccessApiResponse(reply, foundExtractions ?? []);
}
