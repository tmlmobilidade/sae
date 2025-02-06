import { alerts, files } from '@tmlmobilidade/core/interfaces';
import { HttpStatus } from '@tmlmobilidade/core/lib';
import { Alert, Permission } from '@tmlmobilidade/core/types';
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

	static async getAll(request: FastifyRequest, reply: FastifyReply) {
		try {
			const permissions = request.permissions as
			  | Permission<Alert>
			  | undefined;

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
	
	static async getImage(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
		try {
			const { id } = request.params;

			const alert = await alerts.findById(id);

			if (!alert) {
				reply.status(HttpStatus.NOT_FOUND).send({ message: 'Alert not found' });
				return;
			}
			
			const url = await files.getFileUrl({file_id: alert.file_id});

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
				scope: 'alerts',
				type: data.mimetype,
				name: data.filename,
				key: id,
				size: size,
				created_by: 'system', // TODO: Change to user id
				updated_by: 'system', // TODO: Change to user id
			});

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
