/* eslint-disable @typescript-eslint/naming-convention */
/* * */

import { type RoutePreviewDto, type RoutePreviewResponse } from '@/types/shapes.js';
import { routeWithValhalla } from '@/utils/route-preview.js';
import { HTTP_STATUS, HttpException } from '@tmlmobilidade/consts';
import { type FastifyReply, type FastifyRequest } from '@tmlmobilidade/go-clients-fastify';

/* * */

const VALHALLA_URL = process.env.VALHALLA_URL ?? 'https://valhalla.go.tmlmobilidade.pt';

/* * */

export class ShapesController {
	//

	static async routePreview(
		request: FastifyRequest<{ Body: RoutePreviewDto }>,
		reply: FastifyReply<RoutePreviewResponse>,
	) {
		const { costing = 'bus', costing_options, points } = request.body;

		if (!points || points.length < 2) {
			throw new HttpException(HTTP_STATUS.BAD_REQUEST, 'At least 2 points are required');
		}

		for (const point of points) {
			if (typeof point.lat !== 'number' || typeof point.lon !== 'number') {
				throw new HttpException(HTTP_STATUS.BAD_REQUEST, 'Invalid point coordinates');
			}
		}

		const abortController = new AbortController();
		const abortRoute = () => abortController.abort();
		request.raw.once('aborted', abortRoute);
		reply.raw.once('close', abortRoute);

		let routePreview: RoutePreviewResponse;

		try {
			routePreview = await routeWithValhalla(points, {
				costing,
				costing_options,
				signal: abortController.signal,
				url: VALHALLA_URL,
			});
		} catch (error) {
			throw new HttpException(
				HTTP_STATUS.BAD_GATEWAY,
				error instanceof Error ? error.message : 'Valhalla route request failed',
			);
		} finally {
			request.raw.off('aborted', abortRoute);
			reply.raw.off('close', abortRoute);
		}

		return reply.send({
			data: routePreview,
			error: null,
			statusCode: HTTP_STATUS.OK,
		});
	}

	//
}
