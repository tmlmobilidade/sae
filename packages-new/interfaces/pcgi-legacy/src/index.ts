/* * */

import { type MongoClient, MongoDatabaseClient } from '@tmlmobilidade/go-clients-mongo';
import { asyncSingletonProxy } from '@tmlmobilidade/go-utils-exec';

import { CoreManagementDatabase } from './databases/core-management.js';
import { OfferApiLogDatabase } from './databases/offer-api-log.js';

/* * */

class PCGILegacyClass {
	//

	private static _instance: PCGILegacyClass;

	public readonly coreManagement: CoreManagementDatabase;
	public readonly offerApiLog: OfferApiLogDatabase;

	private constructor(mongoClient: MongoClient) {
		this.coreManagement = new CoreManagementDatabase(mongoClient);
		this.offerApiLog = new OfferApiLogDatabase(mongoClient);
	}

	/**
	 * Establishes a connection to the Mongo database and initializes the collection.
	 * @param options Optional Mongo client connection options.
	 * @throws Error if the environment variable for the database URI is missing or if the connection fails.
	 */
	public static async getInstance() {
		if (!PCGILegacyClass._instance) {
			const mongoClient = await MongoDatabaseClient.getClient({ prefix: 'PCGI_LEGACY', tunnelType: 'PCGI' });
			PCGILegacyClass._instance = new PCGILegacyClass(mongoClient);
		}
		return PCGILegacyClass._instance;
	}
}

/* * */

export const pcgiLegacy = asyncSingletonProxy(PCGILegacyClass);
