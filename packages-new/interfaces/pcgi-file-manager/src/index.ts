/* * */

import { type MongoClient, MongoDatabaseClient } from '@tmlmobilidade/go-clients-mongo';
import { asyncSingletonProxy } from '@tmlmobilidade/go-utils-exec';

import { FileManagementDatabase } from './databases/file-management.js';

/* * */

class PCGIFileManagerClass {
	//

	private static _instance: PCGIFileManagerClass;

	public readonly fileManagement: FileManagementDatabase;

	private constructor(mongoClient: MongoClient) {
		this.fileManagement = new FileManagementDatabase(mongoClient);
	}

	/**
	 * Establishes a connection to the Mongo database and initializes the collection.
	 * @param options Optional Mongo client connection options.
	 * @throws Error if the environment variable for the database URI is missing or if the connection fails.
	 */
	public static async getInstance() {
		if (!PCGIFileManagerClass._instance) {
			const mongoClient = await MongoDatabaseClient.getClient({ prefix: 'PCGI_FILE_MANAGER', tunnelType: 'PCGI' });
			PCGIFileManagerClass._instance = new PCGIFileManagerClass(mongoClient);
		}
		return PCGIFileManagerClass._instance;
	}
}

/* * */

export const pcgiFileManager = asyncSingletonProxy(PCGIFileManagerClass);
