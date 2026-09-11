/* * */

import { type MongoClient, MongoDatabaseClient } from '@tmlmobilidade/go-clients-mongo';
import { asyncSingletonProxy } from '@tmlmobilidade/go-utils-exec';

import { CoreDatabase } from './databases/core.js';
import { InfrastructureDatabase } from './databases/infrastructure.js';
import { LocationsDatabase } from './databases/locations.js';
import { OfferDatabase } from './databases/offer.js';
import { OperationDatabase } from './databases/operation.js';

/* * */

class GoDBClass {
	//

	private static _instance: GoDBClass;

	public readonly core: CoreDatabase;
	public readonly infrastructure: InfrastructureDatabase;
	public readonly locations: LocationsDatabase;
	public readonly offer: OfferDatabase;
	public readonly operation: OperationDatabase;

	/**
	 * Establishes a connection to the Mongo database and initializes the collection.
	 * @param options Optional Mongo client connection options.
	 * @throws Error if the environment variable for the database URI is missing or if the connection fails.
	 */
	public static async getInstance() {
		if (!GoDBClass._instance) {
			const mongoClient = await MongoDatabaseClient.getClient({ prefix: 'GODB', tunnelType: 'GO' });
			GoDBClass._instance = new GoDBClass(mongoClient);
		}
		return GoDBClass._instance;
	}

	//
	// Constructor
	private constructor(mongoClient: MongoClient) {
		this.core = new CoreDatabase(mongoClient);
		this.infrastructure = new InfrastructureDatabase(mongoClient);
		this.locations = new LocationsDatabase(mongoClient);
		this.offer = new OfferDatabase(mongoClient);
		this.operation = new OperationDatabase(mongoClient);
	}
}

/* * */

export const goDb = asyncSingletonProxy(GoDBClass);
