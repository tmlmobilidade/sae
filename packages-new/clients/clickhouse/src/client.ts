/* * */

import { ClickHouseClient, ClickHouseLogLevel, createClient } from '@clickhouse/client';
import { createSshTunnelFactory, SshTunnel, SshTunnelType } from '@tmlmobilidade/go-clients-ssh';
import { Logger } from '@tmlmobilidade/logger';

/* * */

/**
 * Configuration for a ClickHouse database client.
 *
 * Every database follows the same env var naming convention, scoped by `prefix`:
 *   `{PREFIX}_HOST` / `{PREFIX}_PORT` — connection endpoint
 *   `{PREFIX}_USER` / `{PREFIX}_PASSWORD` — credentials
 *
 * @example
 * ```ts
 * const client = await ClickHouseDatabaseClient.getClient({ prefix: 'GO_CLICKHOUSE' })
 * ```
 */
export interface ClickHouseDatabaseConfig {
	/** Env var prefix (e.g. `"GO_CLICKHOUSE"`). */
	prefix: string
	/** Type of SSH tunnel to use. */
	tunnelType?: SshTunnelType
}

/**
 * Internal bookkeeping for an active database connection.
 */
interface ClickHouseDatabaseEntry {
	client: ClickHouseClient
	tunnel: null | SshTunnel
}

/**
 * Singleton-per-prefix factory for connected ClickHouse client instances.
 *
 * Each `prefix` maps to one ClickHouse client, created once and cached. Env vars
 * are resolved at creation time using the prefix.
 *
 * @example
 * ```ts
 * const client = await ClickHouseDatabaseClient.getClient({ prefix: 'GO_CLICKHOUSE' })
 * ```
 */
export class ClickHouseDatabaseClient {
	private static entries = new Map<string, Promise<ClickHouseDatabaseEntry>>();

	/**
	 * Gracefully tear down all active database connections and SSH tunnels.
	 * Clears the internal cache so subsequent `getClient` calls re-connect.
	 */
	static async disconnectAll(): Promise<void> {
		const settlements = await Promise.allSettled(this.entries.values());
		for (const settlement of settlements) {
			if (settlement.status === 'fulfilled') {
				const entry = settlement.value;
				if (entry.tunnel) {
					await entry.tunnel.disconnect().catch(() => {});
				}
				await entry.client.close().catch(() => {});
			}
		}
		this.entries.clear();
	}

	/**
	 * Get (or create) a connected ClickHouse client for the given database config.
	 *
	 * Each unique `prefix` produces a singleton client. The first call
	 * validates env vars, optionally establishes an SSH tunnel, creates the
	 * ClickHouse client with standard settings, and connects. Subsequent calls
	 * return the cached client immediately.
	 *
	 * @param config - Database configuration (env var prefix).
	 * @returns A connected ClickHouse client instance.
	 */
	static async getClient(config: ClickHouseDatabaseConfig): Promise<ClickHouseClient> {
		const key = config.prefix;

		if (!this.entries.has(key)) {
			const promise = this.createClient(config).catch((error) => {
				this.entries.delete(key);
				throw error;
			});
			this.entries.set(key, promise);
		}

		const entry = await this.entries.get(key);
		if (!entry) throw new Error(`[${key}] Client not found.`);
		return entry.client;
	}

	/**
	 * Create a new ClickHouseDatabaseEntry by resolving env vars, setting up
	 * the ClickHouse client, and connecting.
	 */
	private static async createClient(config: ClickHouseDatabaseConfig): Promise<ClickHouseDatabaseEntry> {
		const { prefix } = config;

		Logger.info({ message: `[${prefix}] Connecting to database...` });

		const { tunnel, uri } = await this.getConnectionString(config);

		const client = createClient({
			clickhouse_settings: {
				async_insert: 1,
				connect_timeout: 360 * 1000,
				http_receive_timeout: 360 * 1000,
				http_send_timeout: 360 * 1000,
				max_execution_time: 360,
				wait_for_async_insert: 0,
			},
			compression: {
				request: true,
				response: true,
			},
			log: {
				level: ClickHouseLogLevel.OFF,
			},
			request_timeout: 360 * 1000,
			url: uri,
		});

		Logger.info({ message: `[${prefix}] Connected to database.` });

		return { client, tunnel };
	}

	/**
	 * Build a ClickHouse connection string from env vars.
	 *
	 * Two modes:
	 *   - **Direct** (`TUNNEL_ENABLED=false`): `http://user:password@host:port`.
	 *   - **SSH tunnel** (`TUNNEL_ENABLED=true`): creates an `SshTunnelService`,
	 *     connects, and returns a `localhost` URI pointing at the tunnel endpoint.
	 *
	 * Validates that all required vars for the chosen mode are set.
	 *
	 * @returns The resolved URI and an optional SSH tunnel reference.
	 */
	private static async getConnectionString(config: ClickHouseDatabaseConfig): Promise<{ tunnel: null | SshTunnel, uri: string }> {
		const { prefix } = config;
		const env = (name: string) => process.env[`${prefix}_${name}`];

		const host = env('HOST');
		const port = env('PORT');
		const username = env('USERNAME');
		const password = env('PASSWORD');

		if (!host || !port) throw new Error(`Missing ${prefix}_HOST or ${prefix}_PORT`);
		if (!username || !password) throw new Error(`Missing ${prefix}_USERNAME or ${prefix}_PASSWORD`);

		const tunnel = config.tunnelType ? createSshTunnelFactory(config.tunnelType)({ dstAddr: host, dstPort: Number(port) }) : null;

		if (!tunnel) {
			return {
				tunnel: null,
				uri: `http://${username}:${password}@${host}:${port}`,
			};
		}

		Logger.info({ message: `[${prefix}] Setting up SSH Tunnel...` });

		const connection = await tunnel.connect();
		const addr = connection.address();

		if (!addr || typeof addr !== 'object') {
			throw new Error(`[${prefix}] Failed to retrieve SSH tunnel address.`);
		}

		return {
			tunnel,
			uri: `http://${username}:${password}@localhost:${addr.port}`,
		};
	}
}
