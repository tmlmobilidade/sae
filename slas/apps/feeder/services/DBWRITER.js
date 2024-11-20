/* * */

import TIMETRACKER from '@helperkits/timer';

/* * */

class DBWRITER {
	//

	CURRENT_BATCH_DATA = [];

	DB_COLLECTION = null;

	INSTANCE_NAME = 'Unnamed Instance';

	MAX_BATCH_SIZE = 3000;

	/* * */

	constructor(instanceName, collection, options = {}) {
		if (instanceName) this.INSTANCE_NAME = instanceName;
		if (collection) this.DB_COLLECTION = collection;
		if (options.batch_size) this.MAX_BATCH_SIZE = options.batch_size;
	}

	/* * */

	async flush() {
		try {
			//

			const flushTimer = new TIMETRACKER();

			if (this.CURRENT_BATCH_DATA.length === 0) return;

			const writeOperations = this.CURRENT_BATCH_DATA.map((item) => {
				switch (item.options?.write_mode) {
					default:
					case 'replace':
						return {
							replaceOne: {
								filter: item.options.filter,
								replacement: item.data,
								upsert: item.options?.upsert ? true : false,
							},
						};
					case 'update':
						return {
							updateOne: {
								filter: item.options.filter,
								update: item.data,
								upsert: true,
							},
						};
				}
			});

			await this.DB_COLLECTION.bulkWrite(writeOperations);

			console.log(`→ DBWRITER [${this.INSTANCE_NAME}]: Flush Request | Length: ${this.CURRENT_BATCH_DATA.length} | DB Collection: ${this.DB_COLLECTION.collectionName} (${flushTimer.get()})`);

			this.CURRENT_BATCH_DATA = [];

			//
		}
		catch (error) {
			console.log(`✖︎ Error at DBWRITER.flush(): ${error.message}`);
		}
	}

	/* * */

	async write(data, options = {}) {
		// Check if the batch is full
		if (this.CURRENT_BATCH_DATA.length >= this.MAX_BATCH_SIZE) {
			await this.flush();
		}
		// Add the data to the batch
		if (Array.isArray(data)) {
			const combinedDataWithOptions = data.map(item => ({ data: item, options: options }));
			this.CURRENT_BATCH_DATA = [...this.CURRENT_BATCH_DATA, ...combinedDataWithOptions];
		}
		else {
			this.CURRENT_BATCH_DATA.push({ data: data, options: options });
		}
		//
	}
}

export default DBWRITER;
