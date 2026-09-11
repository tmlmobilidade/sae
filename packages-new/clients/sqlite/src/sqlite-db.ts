/* * */

import { SQLiteColumn, SQLiteDatabaseConfig, SQLiteTable } from '@/types.js';
import { Logger } from '@tmlmobilidade/logger';
import { generateRandomString } from '@tmlmobilidade/strings';
import BSQLite3, { type Database, Statement } from 'better-sqlite3';
import fs from 'node:fs';
import { Readable } from 'node:stream';

/* * */

export class SQLiteDatabase {
	//

	public databaseInstance: Database;

	private config: SQLiteDatabaseConfig;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private tables = new Map<string, SQLiteTableInstance<any>>();

	constructor(config: SQLiteDatabaseConfig = {}) {
		//

		//
		// If not provided, generate random values
		// and create a new database instance.

		if (!config.instanceName && !config.memory) {
			config.instanceName = generateRandomString();
		}

		if (!config.instancePath && !config.memory) {
			config.instancePath = `/tmp/${config.instanceName}/${config.instanceName}.db`;
			fs.mkdirSync(`/tmp/${config.instanceName}`, { recursive: true });
			Logger.info({ message: `[SQLITE] Created database at ${config.instancePath}` });
		}

		if (!config.databaseInstance) {
			config.databaseInstance = new BSQLite3(config.memory ? ':memory:' : config.instancePath);
		}

		//
		// Initialize the database instance

		this.config = config;
		this.databaseInstance = config.databaseInstance;
		this.databaseInstance.pragma('journal_mode = WAL');
		this.databaseInstance.pragma('synchronous = ON');
		this.databaseInstance.pragma('temp_store = MEMORY');
	}

	/**
	 * Closes the database instance and handles cleanup of the
	 * database file, either if the database is in memory or on disk.
	 */
	public cleanup(): void {
		this.databaseInstance.close();
		if (this.config.instancePath) {
			fs.rmSync(this.config.instancePath, { force: true, recursive: true });
		}
	}

	/**
	 * Registers a new table and returns an object with methods for that table.
	 */
	public registerTable<T>(tableName: string, params: SQLiteTable<T>): SQLiteTableInstance<T> {
		if (this.tables.has(tableName)) {
			throw new Error(`Table "${tableName}" already registered`);
		}

		const tableInstance = new SQLiteTableInstance<T>(this.databaseInstance, tableName, params);
		this.tables.set(tableName, tableInstance);

		return tableInstance;
	}
}

/* * */

export class SQLiteTableInstance<T> {
	//

	/**
	 * Get the number of rows in the table.
	 * @returns The number of rows.
	 */
	get size(): number {
		const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
		const row = this.databaseInstance.prepare(sql).get() as { count: number };
		return row.count;
	}

	//
	//  Constructor
	private batch: T[] = [];
	private batchSize = 3000;
	private columns: SQLiteColumn<T>[];
	private databaseInstance: Database;
	private insertStatement: Statement;
	private tableName: string;

	constructor(databaseInstance: Database, tableName: string, params: SQLiteTable<T>) {
		//

		//
		// Set up properties

		this.databaseInstance = databaseInstance;
		this.batchSize = params.batch_size ?? 3000;
		this.columns = params.columns;
		this.tableName = tableName;

		// Create table
		this.databaseInstance
			.prepare(`CREATE TABLE IF NOT EXISTS ${this.tableName} (${params.columns.map(c => `"${c.name}" ${c.type}`).join(', ')})`)
			.run();

		// Create indexes
		params.columns.forEach((c) => {
			if (c.indexed) {
				this.databaseInstance.exec(`CREATE INDEX IF NOT EXISTS idx_${this.tableName}_${c.name} ON ${this.tableName}("${c.name}")`);
			}
		});

		//
		// Prepare insert statement

		const placeholders = this.columns.map(() => '?').join(', ');
		const insertSQL = `INSERT INTO ${this.tableName} (${this.columns.map(c => `"${c.name}"`).join(', ')}) VALUES (${placeholders})`;
		this.insertStatement = this.databaseInstance.prepare(insertSQL);
	}

	/**
	 * Get all rows, optionally filtered by a WHERE clause.
	 * @param whereClause Optional SQL WHERE clause (e.g., "WHERE id = ?").
	 * @param params Parameters for the WHERE clause.
	 * @returns An array of matching rows.
	 */
	all(whereClause = '', params: (boolean | number | string)[] = []): T[] {
		const sql = `SELECT * FROM ${this.tableName} ${whereClause}`;
		return this.databaseInstance.prepare(sql).all(...params) as T[];
	}

	/**
	 * Clears all entries from the map.
	 */
	clear(): void {
		this.databaseInstance
			.prepare(`DELETE FROM ${this.tableName}`)
			.run();
	}

	/**
	 * Finds all distinct values for a column in the table.
	 * @param column The column to find distinct values for.
	 * @returns An array of distinct values.
	 */
	distinct<K extends keyof T>(col: K): T[K][] {
		const sql = `SELECT DISTINCT ${String(col)} FROM ${this.tableName}`;
		const rows = this.databaseInstance.prepare(sql).all() as T[K][];
		return rows.map(row => row[String(col)]);
	}

	/**
	 * Flush current buffer into DB synchronously.
	 */
	flush(): void {
		// Skip if batch is empty
		if (this.batch.length === 0) return;
		// Prepare the operation
		const insertManyOperation = this.databaseInstance.transaction((rows: T[]) => {
			rows.forEach((row) => {
				// Populate the columns with the row values
				// to ensure the order of placeholders is preserved
				const rowValues = this.columns.map((col) => {
					const value = row[col.name];
					// Convert boolean to 0 or 1
					if (typeof value === 'boolean') {
						return value ? 1 : 0;
					}
					return value;
				});
				this.insertStatement.run(rowValues);
			});
		});
		// Run the operation
		insertManyOperation(this.batch);
		// Empty batch
		this.batch = [];
	}

	/**
	 * Get a single row by column value.
	 * @param col The column to filter by.
	 * @param value The value to match.
	 * @returns The matching row, or undefined if not found.
	 */
	get<K extends keyof T>(col: K, value: T[K]): T | undefined {
		const sql = `SELECT * FROM ${this.tableName} WHERE ${String(col)} = ? LIMIT 1`;
		return this.databaseInstance.prepare(sql).get(value) as T | undefined;
	}

	/**
	 * Check if a row exists by column value.
	 * @param col The column to filter by.
	 * @param value The value to match.
	 * @returns True if the row exists, false otherwise.
	 */
	has<K extends keyof T>(col: K, value: T[K]): boolean {
		const sql = `SELECT 1 FROM ${this.tableName} WHERE ${String(col)} = ? LIMIT 1`;
		return !!this.databaseInstance.prepare(sql).get(value);
	}

	/**
	 * Execute a query and return the result as an array of rows.
	 * @param sqlQuery The SQL query to execute.
	 * @param params The parameters for the query.
	 * @returns The result as an array of rows.
	 */
	query<R>(sqlQuery = '', params: (boolean | number | string)[] = []) {
		return this.databaseInstance.prepare(sqlQuery).all(...params) as R[];
	}

	/**
	 * Iterator to go through all rows in the table.
	 */
	stream(whereClause = '', params: (boolean | number | string)[] = []): Readable {
		// Create an iterator for the query
		const iterator = this.databaseInstance
			.prepare(`SELECT * FROM ${this.tableName} ${whereClause}`)
			.iterate(...params);
		// Return a Readable stream in object mode
		return new Readable({
			objectMode: true,
			read() {
				const next = iterator.next();
				if (next.done) this.push(null); // end of stream
				else this.push(next.value as T);
			},
		});
	}

	/**
	 * Update one or more rows in the table.
	 * @param whereClause The WHERE clause to filter the rows to update.
	 * @param newData The data to update the rows with.
	 * @param params The parameters for the WHERE clause.
	 * @returns The updated rows.
	 */
	update(whereClause = '', newData: Partial<T>, params: (boolean | number | string)[] = []): T[] {
		const sql = `UPDATE ${this.tableName} SET ${Object.keys(newData).map(key => `${key} = ?`).join(', ')} WHERE ${whereClause}`;
		return this.databaseInstance.prepare(sql).all(...params) as T[];
	}

	/**
	 * Add one item to buffer, flush automatically when batchSize reached.
	 */
	write(item: T): void {
		this.batch.push(item);
		if (this.batch.length >= this.batchSize) this.flush();
	}

	//
}
