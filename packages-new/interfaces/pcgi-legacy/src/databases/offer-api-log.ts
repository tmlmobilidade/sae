/* * */

import { type Db, type MongoClient } from '@tmlmobilidade/go-clients-mongo';

import { MongoInterfaceTemplate } from '../interface.template.js';

/* * */

export class OfferApiLogDatabase {
	//

	public readonly vehicleEvents: MongoInterfaceTemplate<any>;

	private readonly database: Db;
	private readonly databaseName = 'OfferApiLog';

	public constructor(instance: MongoClient) {
		// Create the database instance
		this.database = instance.db(this.databaseName);
		// Create collection interfaces
		this.vehicleEvents = new MongoInterfaceTemplate<any>('VehicleEvents', this.database);
	}
}
