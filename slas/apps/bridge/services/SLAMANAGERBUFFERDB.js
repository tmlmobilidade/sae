/* * */

import LOGGER from '@helperkits/logger';
import { MongoClient } from 'mongodb';

/* * */

const MAX_CONNECTION_RETRIES = 1;

/* * */

class SLAMANAGERBUFFERDB {
	//

	constructor() {
		//
		this.mongoClientConnecting = false;
		this.mongoClientConnectionRetries = 0;
		this.mongoClientConnectionInstance = null;
		//
	}

	/* * *
   * CONNECT
   * This function sets up a MongoDB client instance with the necessary databases and collections.
   */

	async connect() {
		try {
			LOGGER.info('SLAMANAGERBUFFERDB: New connection request...');

			//
			// If another connection request is already in progress, wait for it to complete

			if (this.mongoClientConnecting) {
				LOGGER.info('SLAMANAGERBUFFERDB: Waiting for MongoDB Client connection...');
				await this.waitForMongoClientConnection();
				return;
			}

			//
			// Setup the flag to prevent double connection

			this.mongoClientConnecting = true;

			//
			// Setup MongoDB connection options

			const mongoClientOptions = {
				// readPreference: 'secondaryPreferred',
				connectTimeoutMS: 5000,
				directConnection: true,
				maxPoolSize: 200,
				minPoolSize: 2,
				serverSelectionTimeoutMS: 5000,
			};

			//
			// Create the client instance

			let mongoClientInstance;

			//
			// Check if there is already an active MongoDB Client connection

			if (this.mongoClientConnectionInstance && this.mongoClientConnectionInstance.topology && this.mongoClientConnectionInstance.topology.isConnected()) {
				mongoClientInstance = this.mongoClientConnectionInstance;
			}
			else {
				mongoClientInstance = await new MongoClient(process.env.SLAMANAGERBUFFERDB_MONGODB_URI, mongoClientOptions).connect();
			}

			//
			// Setup databases

			const productionDatabase = mongoClientInstance.db('production');

			//
			// Setup collections

			this.BufferData = productionDatabase.collection('BufferData');
			this.OperationalDayStatus = productionDatabase.collection('OperationalDayStatus');

			//
			// Setup indexes

			this.BufferData.createIndex({ pcgi_id: 1 }, { unique: true });
			this.BufferData.createIndex({ original_id: 1 });
			this.BufferData.createIndex({ type: 1 });
			this.BufferData.createIndex({ agency_id: 1 });
			this.BufferData.createIndex({ line_id: 1 });
			this.BufferData.createIndex({ route_id: 1 });
			this.BufferData.createIndex({ pattern_id: 1 });
			this.BufferData.createIndex({ trip_id: 1 });
			this.BufferData.createIndex({ stop_id: 1 });
			this.BufferData.createIndex({ operational_day: 1 });
			this.BufferData.createIndex({ operational_day: 1, trip_id: 1 });
			this.BufferData.createIndex({ operational_day: 1, type: 1 });

			this.OperationalDayStatus.createIndex({ operational_day: 1 }, { unique: true });

			//
			// Save the instance in memory

			if (process.env.NODE_ENV === 'development') global._mongoClientConnectionInstance = mongoClientInstance;
			else this.mongoClientConnectionInstance = mongoClientInstance;

			//
			// Reset flags

			this.mongoClientConnecting = false;
			this.mongoClientConnectionRetries = 0;

			//
		}
		catch (error) {
			this.mongoClientConnectionRetries++;
			if (this.mongoClientConnectionRetries < MAX_CONNECTION_RETRIES) {
				console.error(`✖︎ SLAMANAGERBUFFERDB: Error creating MongoDB Client instance ["${error.message}"]. Retrying (${this.mongoClientConnectionRetries}/${MAX_CONNECTION_RETRIES})...`);
				await this.reset();
				await this.connect();
			}
			else {
				console.error('✖︎ SLAMANAGERBUFFERDB: Error creating MongoDB Client instance:', error);
				await this.reset();
			}
		}

		//
	}

	/* * *
   * RESET CONNECTIONS
   * Resets all connections and flags
   */

	async reset() {
		this.mongoClientConnecting = false;
		this.mongoClientConnectionInstance = null;
		global._mongoClientConnectionInstance = null;
		LOGGER.info('SLAMANAGERBUFFERDB: Reset connection.');
	}

	async waitForMongoClientConnection() {
		return new Promise((resolve) => {
			const interval = setInterval(() => {
				if (!this.mongoClientConnecting) {
					clearInterval(interval);
					resolve();
				}
			}, 100);
		});
	}

	//
}

/* * */

export default new SLAMANAGERBUFFERDB();
