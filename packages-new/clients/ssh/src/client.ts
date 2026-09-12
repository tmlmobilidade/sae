/* * */

import { Logger } from '@tmlmobilidade/logger';
import { type AddressInfo, type Server } from 'node:net';
import { createTunnel, type ForwardOptions, type ServerOptions, type SshOptions, type TunnelOptions } from 'tunnel-ssh';

/* * */

export interface SshConfig {
	forwardOptions: ForwardOptions
	serverOptions: ServerOptions
	sshOptions: SshOptions
	tunnelOptions: TunnelOptions
}

export interface SshTunnelOptions {
	maxRetries?: number
}

/* * */

export class SshTunnel {
	private _server: Server | undefined;
	private config: SshConfig;
	private onDisconnect?: () => void;
	private options: SshTunnelOptions;
	private retries = 0;

	constructor(config: SshConfig, options?: SshTunnelOptions, onDisconnect?: () => void) {
		this.config = config;
		this.onDisconnect = onDisconnect;
		if (options) this.options = options;
	}

	get server(): Server | undefined {
		return this._server;
	}

	/**
	 * Establishes an SSH tunnel connection using the provided configuration options.
	 * @throws Throws an error if the connection fails after the maximum number of retries.
	 * @remarks
	 * - The method attempts to create an SSH tunnel using the `createTunnel` function with the specified options.
	 * - If the connection is successful, it logs the connected host port and sets up an error listener on the server.
	 * - If the connection fails, it retries the connection up to a maximum number of retries specified in the options.
	 * @example ```typescript
	 * const SshTunnel = new SshTunnel(config);
	 * SshTunnel.connect();
	 * ```
	 */
	async connect() {
		try {
			if (this._server) {
				// If the server is already connected, return it
				console.log(`⤷ SSH Tunnel already connected.`);
				return this._server;
			}

			const [server] = await createTunnel(this.config.tunnelOptions, this.config.serverOptions, this.config.sshOptions, this.config.forwardOptions);
			Logger.info({ message: `SSH Tunnel connected to host port ${(server.address() as AddressInfo).port}` });

			this._server = server;

			server.on('error', (error) => {
				Logger.error({ error, message: 'SSH Tunnel Error' });
			});

			server.on('close', () => {
				Logger.info({ message: 'SSH Tunnel closed.' });
			});

			return this._server;
		} catch (error) {
			if (error.code === 'EADDRINUSE') {
				Logger.info({ message: `Port "${this.config.serverOptions.port}" already in use. Retrying with a different port...` });
				this.config.serverOptions.port = (this.config.serverOptions.port ?? 2345) + 1;
				return await this.connect();
			} else if (this.retries < (this.options?.maxRetries || 3)) {
				Logger.error({ error, message: 'Failed to connect to SSH Tunnel.' });
				this.retries++;
				Logger.info({ message: 'Retrying SSH connection...' });
				return await this.connect();
			} else {
				throw new Error('Error connecting to SSH tunnel', { cause: error });
			}
		}
	}

	/**
	 * Disconnects the SSH tunnel by closing the server.
	 * @returns A promise that resolves when the server is successfully closed.
	 * @throws Will log an error message if the server fails to close.
	 */
	async disconnect() {
		try {
			this._server?.close();
			this._server = undefined;
			this.onDisconnect?.();
			console.log(`⤷ SSH Tunnel disconnected.`);
		} catch (error) {
			console.log(`⤷ ERROR: Failed to disconnect from SSH Tunnel.`, error);
		}
	}

	/**
	 * Reconnects the SSH tunnel by first disconnecting and then connecting again.
	 * This method ensures that the connection is reset.
	 * @returns A promise that resolves when the reconnection process is complete.
	 */
	async reconnect() {
		await this.disconnect();
		await this.connect();
	}
}
