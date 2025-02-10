import { parseServiceAlert } from '@/utils/service-alert-parser';
import { alerts, files } from '@tmlmobilidade/core/interfaces';
import { HttpStatus } from '@tmlmobilidade/core/lib';
import { Alert } from '@tmlmobilidade/core/types';
import { FastifyReply, FastifyRequest } from 'fastify';

export class AlertsController {
	static async create(request: FastifyRequest, reply: FastifyReply) {
		try {
			const alertData = request.body as Alert;

			const result = await alerts.insertOne(alertData);

			reply.send({ data: result, message: 'Alert created' });
		}
		catch (error) {
			reply
				.status(error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR)
				.send(error);
		}
	}

	static async delete(
		request: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) {
		try {
			const { id } = request.params;
			await alerts.deleteById(id);

			reply.send({ message: `Alert with id: ${id} deleted` });
		}
		catch (error) {
			reply
				.status(error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR)
				.send(error);
		}
	}

	static async deleteImage(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
		try {
			const { id } = request.params;

			const alert = await alerts.findById(id);

			if (!alert) {
				reply.status(HttpStatus.NOT_FOUND).send({ message: 'Alert not found' });
				return;
			}

			if (!alert.file_id) {
				reply.status(HttpStatus.NOT_FOUND).send({ message: 'Image not found' });
				return;
			}

			await files.deleteById(alert.file_id);
			await alerts.updateById(id, { file_id: undefined });

			reply.send({
				message: 'Image deleted',
			});
		}
		catch (error) {
			reply
				.status(error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR)
				.send(error);
		}
	}

	static async getAll(request: FastifyRequest, reply: FastifyReply) {
		try {
			reply.send(await alerts.findMany({}, undefined, undefined, { created_at: -1 }));
		}
		catch (error) {
			reply
				.status(error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR)
				.send(error);
		}
	}

	static async getById(
		request: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) {
		try {
			const { id } = request.params;

			const alert = await alerts.findById(id);

			if (!alert) {
				reply.status(HttpStatus.NOT_FOUND).send({ message: 'Alert not found' });
				return;
			}

			reply.send(alert);
		}
		catch (error) {
			reply
				.status(error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR)
				.send(error);
		}
	}

	static async getGtfs(request: FastifyRequest, reply: FastifyReply) {
		try {
			const result = await alerts.findMany({
				$or: [
					{
						active_period_end_date: { $gte: new Date() },
					},
					{
						publish_end_date: { $gte: new Date() },
					},
				],
			}, undefined, undefined, { created_at: -1 });

			const serviceAlerts = result.map(alert => parseServiceAlert(alert));

			reply.send({
				entity: serviceAlerts,
				header: {
					gtfs_realtime_version: '2.0',
					incrementality: 'FULL_DATASET',
					timestamp: Math.floor(new Date().getTime() / 1000),
				},
			});
		}
		catch (error) {
			reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
		}
	}

	static async getImage(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
		try {
			const { id } = request.params;

			const alert = await alerts.findById(id);

			if (!alert) {
				reply.status(HttpStatus.NOT_FOUND).send({ message: 'Alert not found' });
				return;
			}

			const url = await files.getFileUrl({ file_id: alert.file_id });

			reply.send({
				data: url,
				message: 'Image retrieved',
			});
		}
		catch (error) {
			reply
				.status(error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR)
				.send(error);
		}
	}

	static async update(
		request: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) {
		try {
			const { id } = request.params;
			const alertData = request.body as Partial<Alert>;

			await alerts.updateById(id, alertData);

			reply.send({
				data: alertData,
				message: `Alert with id: ${id} updated`,
			});
		}
		catch (error) {
			reply
				.status(error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR)
				.send(error);
		}
	}

	static async uploadImage(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
		try {
			const { id } = request.params;

			const alert = await alerts.findById(id);

			if (!alert) {
				reply.status(HttpStatus.NOT_FOUND).send({ message: 'Alert not found' });
				return;
			}
			// Parse the file from the request
			const data = await request.file();
			const buffer = await data.toBuffer();
			const size = buffer.buffer.byteLength;

			const result = await files.upload(buffer, {
				created_by: 'system', // TODO: Change to user id
				name: data.filename,
				resource_id: id,
				scope: 'alerts',
				size: size,
				type: data.mimetype,
				updated_by: 'system', // TODO: Change to user id
			});

			// Delete the old image if it exists
			try {
				if (alert.file_id) {
					await files.deleteById(alert.file_id);
				}
			}
			catch (error) {
				console.error(error);
			}

			await alerts.updateById(id, { file_id: result.insertedId.toString() });

			reply.send({
				data: result,
				message: 'Image uploaded',
			});
		}
		catch (error) {
			reply
				.status(error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR)
				.send(error);
		}
	}
}
