/* * */

import { ClickHouseClient, ClickHouseDatabaseClient, queryEachStatementFromFile, queryFromFile, queryFromString } from '@tmlmobilidade/go-clients-clickhouse';
import { asyncSingletonProxy } from '@tmlmobilidade/go-utils-exec';

import { OperationDatabase } from './databases/operation.js';
import { PerformanceDatabase } from './databases/performance.js';
import { SimplifiedApexDatabase } from './databases/simplified-apex.js';

/* * */

class LabDbClass {
	//

	private static _instance: null | Promise<LabDbClass> = null;

	public readonly operation: OperationDatabase;
	public readonly performance: PerformanceDatabase;
	public readonly simplifiedApex: SimplifiedApexDatabase;

	private readonly clickhouseClient: ClickHouseClient;

	private constructor(client: ClickHouseClient) {
		this.clickhouseClient = client;
		this.operation = new OperationDatabase(this.clickhouseClient);
		this.performance = new PerformanceDatabase(this.clickhouseClient);
		this.simplifiedApex = new SimplifiedApexDatabase(this.clickhouseClient);
	}

	/**
	 * Returns the singleton instance.
	 * Concurrent callers share the same initialization promise so schema setup runs once.
	 */
	public static async getInstance() {
		if (!LabDbClass._instance) {
			LabDbClass._instance = (async () => {
				const clickhouseClient = await ClickHouseDatabaseClient.getClient({ prefix: 'LABDB', tunnelType: 'GO' });
				const instance = new LabDbClass(clickhouseClient);
				// Behaves like an async constructor: create DBs/tables before the proxy exposes the instance.
				await instance.init();
				return instance;
			})();
		}
		return await LabDbClass._instance;
	}

	/**
     * It should be used for statements that do not have any output,
     * when the format clause is not applicable, or when you are not interested in the response at all.
     * The response stream is destroyed immediately as we do not expect useful information there.
	 *
	 * Examples of such statements are DDLs or custom inserts.
     */
	public async command(...args: Parameters<ClickHouseClient['command']>) {
		return await this.clickhouseClient.command(...args);
	}

	/**
	 * Returns the ClickHouse client.
	 * @returns The ClickHouse client.
	 * @deprecated Avoid using this method directly. Find alternative ways
	 * to query the database using the database-specific methods instead.
	 */
	public async getClient(): Promise<ClickHouseClient> {
		const instance = await LabDbClass.getInstance();
		return instance.clickhouseClient;
	}

	private async init() {
		await Promise.all([
			this.operation.init(),
			this.performance.init(),
			this.simplifiedApex.init(),
		]);
	}

	/**
     * The primary method for data insertion. It is recommended to avoid arrays in case of large inserts
     * to reduce application memory consumption and consider streaming for most of such use cases.
     * As the insert operation does not provide any output, the response stream is immediately destroyed.
     */
	public async insert(...args: Parameters<ClickHouseClient['insert']>) {
		return await this.clickhouseClient.insert(...args);
	}

	/**
     * Used for most statements that can have a response, such as `SELECT`.
     *
     * The `FORMAT` clause should be specified separately via {@link QueryParams.format} (default is `JSON`);
     * this method will always append `FORMAT <format>` to the end of {@link QueryParams.query}.
     * If the query already contains a `FORMAT` clause, ClickHouse will return a syntax error due to a duplicate `FORMAT`.
     * This is intended behavior.
	 *
     * Use {@link labDb.insert} for data insertion, {@link labDb.command} for DDLs.
     */
	public async query(...args: Parameters<ClickHouseClient['query']>) {
		return await this.clickhouseClient.query(...args);
	}

	/**
	 * Executes a query from a .sql file with optional parameter substitutions.
	 * @param filePath Absolute or relative path to the .sql file.
	 * @param params Optional key-value substitutions applied to the query (replaces {key} placeholders).
	 * @returns Query result rows typed as `T`.
	 * @example
	 * const users = await labDb.queryEachStatementFromFile<User>('get_users.sql', {
	 *   start_date: '2024-01-01',
	 *   end_date: '2024-12-31',
	 * });
	*/
	public async queryEachStatementFromFile<T>(filePath: string, params?: Record<string, number | string | string[]>): ReturnType<typeof queryEachStatementFromFile<T>> {
		return await queryEachStatementFromFile<T>(this.clickhouseClient, filePath, params);
	}

	/**
	 * Executes a query from a .sql file with optional parameter substitutions.
	 * @param filePath Absolute or relative path to the .sql file.
	 * @param params Optional key-value substitutions applied to the query (replaces {key} placeholders).
	 * @returns Query result rows typed as `T`.
	 * @example
	 * // Given a SQL file "get_users.sql" with the content:
	 * // SELECT * FROM users WHERE created_at >= {start_date} AND created_at <= {end_date}
	 * const users = await clickhouseService.queryFromFile<User>('get_users.sql', {
	 *   start_date: '2024-01-01',
	 *   end_date: '2024-12-31',
	 * });
	*/
	public async queryFromFile<T>(filePath: string, params?: Record<string, number | string | string[]>): ReturnType<typeof queryFromFile<T>> {
		return await queryFromFile<T>(this.clickhouseClient, filePath, params);
	}

	/**
	 * Executes a query from a string.
	 * @param client The ClickHouse client to use for executing the query.
	 * @param query The SQL query to execute, with optional {key} placeholders for parameters.
	 * @param params Optional key-value substitutions applied to the query (replaces {key} placeholders).
	 * @returns Query result rows typed as `T`.
	 * @example
	 * const users = await queryFromString<User>(clickhouseClient,
	 *   'SELECT * FROM users WHERE created_at >= {start_date} AND created_at <= {end_date}',
	 *   { start_date: '2024-01-01', end_date: '2024-12-31' }
	 * );
	*/
	public async queryFromString<T>(query: string, params?: Record<string, number | string | string[]>): ReturnType<typeof queryFromString<T>> {
		return await queryFromString<T>(this.clickhouseClient, query, params);
	}
}

/* * */

export const labDb = asyncSingletonProxy(LabDbClass);
