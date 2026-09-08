/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type SimplifiedApexOnBoardSale } from '@tmlmobilidade/go-types-apex';
import { type Ride } from '@tmlmobilidade/go-types-operation';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/**
 * Get SimplifiedApexOnBoardSales by Ride ID.
 * @param request The Fastify request object.
 * @param reply The Fastify reply object.
 */
export async function getSimplifiedApexOnBoardSalesHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply<SimplifiedApexOnBoardSale[]>) {
	try {
		//

		//
		// Validate the request parameters

		if (!request.params.id) {
			return sendErrorApiResponse(reply, {
				error: 'Missing ride "id" parameter.',
				status_code: '400',
			});
		}

		//
		// Fetch the ride data from the database

		const ridesQueryResult = await labDb.queryFromString<Pick<Ride, 'agency_id' | 'start_time_scheduled' | 'trip_id'>>(
			'SELECT agency_id, start_time_scheduled, trip_id FROM operation.rides WHERE _id = $1 ORDER BY updated_at DESC LIMIT 1 BY _id',
			{ 1: request.params.id },
		);

		if (!ridesQueryResult?.length) {
			return sendErrorApiResponse(reply, {
				error: 'Ride not found.',
				status_code: '404',
			});
		}

		const rideData = ridesQueryResult[0];

		//
		// Fetch the simplified apex on board sales data by ride ID
		// and send it back to the client

		const standardWindowInterval = Dates.fromUnixMilliseconds(rideData.start_time_scheduled).std_window;

		const simplifiedApexOnBoardSalesData = await labDb.simplifiedApex.sales.select(
			'*',
			`created_at >= $1 AND created_at <= $2 AND agency_id = $3 AND trip_id = $4`,
			{ 1: standardWindowInterval.start, 2: standardWindowInterval.end, 3: rideData.agency_id, 4: rideData.trip_id },
		);

		//
		// Send the ride data back to the client

		return sendSuccessApiResponse(reply, simplifiedApexOnBoardSalesData ?? []);

		//
	} catch (error) {
		return sendErrorApiResponse(reply, {
			error: error.message,
			status_code: '500',
		});
	}
}
