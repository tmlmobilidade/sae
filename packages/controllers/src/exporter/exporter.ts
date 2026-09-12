// /* * */

// import { HTTP_STATUS, HttpException } from '@tmlmobilidade/consts';
// import { type FastifyReply, type FastifyRequest } from '@tmlmobilidade/go-clients-fastify';
// import { goDb } from '@tmlmobilidade/go-interfaces-godb';
// import { storageProvider } from '@tmlmobilidade/go-providers-storage';
// import { type CreateFileExportDto, type FileExport } from '@tmlmobilidade/go-types-downloads';
// import { Logger } from '@tmlmobilidade/logger';

// /* * */

// export class ExporterSharedController {
// 	//

// 	/**
// 	 * Returns an Agency by ID.
// 	 * @param request The request object
// 	 * @param reply The reply object
// 	 */
// 	// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 	static async create(request: FastifyRequest<{ Body: CreateFileExportDto<any> }>, reply: FastifyReply<FileExport>) {
// 		const fileExportData = await goDb.core.exports.insertOne({
// 			...request.body,
// 			created_by: request.me._id,
// 			processing_status: 'waiting',
// 			updated_by: request.me._id,
// 		});
// 		return reply.send({ data: fileExportData, error: null, statusCode: HTTP_STATUS.CREATED });
// 	}

// 	/**
// 	 * Downloads a FileExport by ID.
// 	 * @param request The request object
// 	 * @param reply The reply object
// 	 */
// 	static async download(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply<string>) {
// 		//

// 		const { id } = request.params;
// 		const context = { action: 'download', feature: 'exporter', request, value: id };

// 		// Find file export by ID
// 		const fileExport = await goDb.core.exports.findById(id);
// 		if (!fileExport) {
// 			const error = new HttpException(HTTP_STATUS.NOT_FOUND, 'File export not found');
// 			Logger.issue({ context, level: 'error', messageOrError: error });

// 			throw error;
// 		}

// 		// Retrieve file data from storage
// 		const foundFileData = await storageProvider.findById(fileExport.file_id);
// 		const storageServiceResponse = await fetch(foundFileData.url);
// 		if (!storageServiceResponse.ok || !storageServiceResponse.body) {
// 			const error = new HttpException(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Could not fetch file');
// 			Logger.issue({ context, level: 'error', messageOrError: error });

// 			throw error;
// 		}

// 		// Set headers and pipe the response body to the client
// 		reply.header('Content-Disposition', `attachment; filename="${foundFileData.name}"`);
// 		reply.header('Content-Type', foundFileData.type);

// 		// Set content length if available
// 		const contentLength = storageServiceResponse.headers.get('Content-Length');
// 		if (contentLength) reply.header('Content-Length', contentLength);

// 		// Pipe the response body to the client
// 		return reply.send(storageServiceResponse.body);
// 	}

// 	/**
// 	 * Returns all FileExport sorted by ID.
// 	 * @param request The request object
// 	 * @param reply The reply object
// 	 */
// 	static async getAll(request: FastifyRequest, reply: FastifyReply<FileExport[]>) {
// 		const filters = {
// 			created_by: request.me._id,
// 		};

// 		const allFileExport = await goDb.core.exports.findMany(filters);
// 		return reply.send({ data: allFileExport, error: null, statusCode: HTTP_STATUS.OK });
// 	}

// 	//
// }
