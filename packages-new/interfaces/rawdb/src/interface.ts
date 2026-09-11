/* * */

import { type MongoClient, MongoDatabaseClient } from '@tmlmobilidade/go-clients-mongo';
import { asyncSingletonProxy } from '@tmlmobilidade/go-utils-exec';

import { ApexDatabase } from './databases/apex.js';
import { CoreManagementCopyDatabase } from './databases/core-management.js';
import { VehicleEventsDatabase } from './databases/vehicle-events.js';

/* * */

class RawDBClass {
	//

	private static _instance: RawDBClass;

	public readonly apex: ApexDatabase;
	public readonly coreManagementCopy: CoreManagementCopyDatabase;
	public readonly vehicleEvents: VehicleEventsDatabase;

	private readonly mongoClient: MongoClient;

	private constructor(mongoClient: MongoClient) {
		this.mongoClient = mongoClient;
		this.apex = new ApexDatabase(this.mongoClient);
		this.vehicleEvents = new VehicleEventsDatabase(this.mongoClient);
		this.coreManagementCopy = new CoreManagementCopyDatabase(this.mongoClient);
	}

	/**
	 * Establishes a connection to the Mongo database and initializes the collection.
	 * @throws Error if required RAW_DB_* environment variables are missing or if the connection fails.
	 */
	public static async getInstance() {
		if (!RawDBClass._instance) {
			const mongoClient = await MongoDatabaseClient.getClient({ prefix: 'RAWDB', tunnelType: 'GO' });
			RawDBClass._instance = new RawDBClass(mongoClient);
		}
		return RawDBClass._instance;
	}
}

/* * */

export const rawDb = asyncSingletonProxy(RawDBClass);
