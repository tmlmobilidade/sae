/* * */

import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

interface PostgresWriterOptions {
	batch_size?: number
}

/* * */

export class PostgresWriter {
	//

	private CURRENT_BATCH_DATA = [];

	private DB_CLIENT = null;

	private DB_TABLE = null;

	private INSTANCE_NAME = 'Unnamed Instance';

	private MAX_BATCH_SIZE = 250;

	private SESSION_TIMER = new TIMETRACKER();

	/* * */

	constructor(instanceName: string, client, table, options?: PostgresWriterOptions) {
		if (instanceName) this.INSTANCE_NAME = instanceName;
		if (client) this.DB_CLIENT = client;
		if (table) this.DB_TABLE = table;
		if (options?.batch_size) this.MAX_BATCH_SIZE = options.batch_size;
	}

	/* * */

	async flush() {
		try {
			//

			const flushTimer = new TIMETRACKER();
			const sssionTimerResult = this.SESSION_TIMER.get();

			if (this.CURRENT_BATCH_DATA.length === 0) return;

			const columns = Object.keys(this.CURRENT_BATCH_DATA[0]);

			const values = [];
			const placeholders = this.CURRENT_BATCH_DATA.map((item) => {
				const rowValues = columns.map((key) => {
					values.push(item[key]);
					return `$${values.length}`;
				});
				return `(${rowValues.join(', ')})`;
			});

			const insertQuery = `
				INSERT INTO ${this.DB_TABLE} (${columns.join(', ')})
				VALUES ${placeholders.join(', ')}
				ON CONFLICT DO NOTHING;
			`;

			await this.DB_CLIENT.query(insertQuery, values);

			LOGGER.info(`POSTGRESWRITER [${this.INSTANCE_NAME}]: Flush | Length: ${this.CURRENT_BATCH_DATA.length} | DB Table: ${this.DB_TABLE} (session: ${sssionTimerResult}) (flush: ${flushTimer.get()})`);

			this.CURRENT_BATCH_DATA = [];

			//
		}
		catch (error) {
			LOGGER.error(`POSTGRESWRITER [${this.INSTANCE_NAME}]: Error @ flush(): ${error.message}`);
		}
	}

	/* * */

	async write(data, options = {}) {
		// Check if the batch is full
		if (this.CURRENT_BATCH_DATA.length >= this.MAX_BATCH_SIZE) {
			await this.flush();
		}
		// Reset the timer
		if (this.CURRENT_BATCH_DATA.length === 0) {
			this.SESSION_TIMER.reset();
		}
		// Add the data to the batch
		if (Array.isArray(data)) {
			const combinedDataWithOptions = data.map(item => ({ data: item, options: options }));
			this.CURRENT_BATCH_DATA = [...this.CURRENT_BATCH_DATA, ...combinedDataWithOptions];
		}
		else {
			this.CURRENT_BATCH_DATA.push(data);
		}
		//
	}

	//
}
