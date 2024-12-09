import { HttpException, HttpStatus } from '@tmlmobilidade/services/lib';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthProvider } from '@tmlmobilidade/services/providers';
import { Permission } from '@tmlmobilidade/services/types';

declare module 'fastify' {
	export interface FastifyRequest {
		permissions?: Permission<unknown>; // Changed T to unknown to resolve the error
	}
}

export default function authorizationMiddleware<T = unknown>( // Added default type for T
	scope: string,
	action: string
) {
	return async (
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> => {
		const token = request.headers.authorization?.split(' ')[1];

		console.log('token', token);

		if (!token) {
			throw new HttpException(
				HttpStatus.UNAUTHORIZED,
				'Invalid authorization token'
			);
		}
		try {
			const permissions = await AuthProvider.getPermissions<T>(
				token,
				scope,
				action
			);
			request.permissions = permissions;
		} catch (error) {
			reply
				.status(error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR)
				.send({
					message: error.message || 'An unexpected error occurred',
				});
		}
	};
}