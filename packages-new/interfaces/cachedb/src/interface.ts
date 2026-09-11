/* * */

import { type RedisClientType, RedisDatabaseClient } from '@tmlmobilidade/go-clients-redis';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { asyncSingletonProxy } from '@tmlmobilidade/utils';

import { type CacheDbKey } from './keys.js';
import { CachedData } from './types.js';

/* * */

class CacheDbClass {
	//

	private static _instance: null | Promise<CacheDbClass> = null;

	private client: RedisClientType;

	/**
	 * Returns the singleton instance of the subclass.
	 */
	public static async getInstance() {
		// If no instance exists, create one and store the promise.
		// This ensures that if multiple calls to getInstance() happen concurrently,
		// they will all await the same initialization process.
		if (!this._instance) {
			this._instance = (async () => {
				const instance = new CacheDbClass();
				// This behaves like the constructor,
				// but allows for async initialization.
				await instance.init();
				return instance;
			})();
		}
		// Await the instance if it's still initializing,
		// or return it immediately if ready.
		return await this._instance;
	}

	/**
	 * Deletes all keys from the cache that are not allowed by {@link isAllowedHubcacheDbKey}.
	 * This method is useful for maintaining a clean state free of stale
	 * or irrelevant cache entries that consume storage and memory resources.
	 * @returns A promise that resolves when the cleaning process is complete.
	 * @throws Will throw an error if the cleaning process fails.
	 */
	public async clean() {
		const allKeys = await this.client.keys('*');
		const keysToDelete = allKeys.filter(key => key);
		if (keysToDelete.length) await this.client.del(keysToDelete);
	}

	/**
	 * Deletes a cache entry by its key.
	 * @param key The key of the cache entry to delete.
	 * @returns A promise that resolves when the deletion process is complete.
	 * @throws Will throw an error if the deletion process fails.
	 */
	public async delete(key: CacheDbKey) {
		await this.client.del(key as string);
	}

	/**
	 * Deletes multiple cache entries.
	 * @param keys The list of keys to delete.
	 */
	public async deleteMany(keys: string[]) {
		if (!keys.length) return;
		await this.client.del(keys);
	}

	/**
	 * Retrieves a cache entry by its key.
	 * @param key The key of the cache entry to retrieve.
	 * @returns A promise that resolves with the cache entry value,
	 * or `null` if not found.
	 * @throws Will throw an error if the retrieval process fails.
	 */
	public async get(key: CacheDbKey): Promise<null | string> {
		const result = await this.client.get(key);
		if (typeof result !== 'string') return null;
		return result;
	}

	/**
	 * Retrieves a cache entry by its key.
	 * @param key The key of the cache entry to retrieve.
	 * @returns A promise that resolves with the cache entry value,
	 * or `null` if not found.
	 * @throws Will throw an error if the retrieval process fails.
	 */
	public async getNew<T>(key: CacheDbKey): Promise<CachedData<T> | null> {
		const result = await this.client.get(key);
		if (typeof result !== 'string') return null;
		return JSON.parse(result) as CachedData<T>;
	}

	/**
	 * Scans cache keys by pattern.
	 * @param pattern The redis pattern to match.
	 * @returns A promise resolving with all matching keys.
	 */
	public async scan(pattern: string): Promise<string[]> {
		const foundKeys = new Set<string>();
		for await (const scanResult of this.client.scanIterator({ MATCH: pattern, TYPE: 'string' })) {
			// Scan result is an array of keys because Redis just goes over all keys
			// in the database without any specific order or pagination and returns
			// only the ones that match the requested pattern.
			scanResult.forEach(key => foundKeys.add(key));
		}
		return Array.from(foundKeys);
	}

	/**
	 * Saves a cache entry with an optional time-to-live (TTL).
	 * @param key The key of the cache entry to save.
	 * @param value The value of the cache entry to save. Must be a string.
	 * @param ttl Optional time-to-live (TTL) in seconds. Omit when not needed.
	 */
	public async set(key: CacheDbKey, value: string, ttl?: number) {
		// Validate value type before setting cache
		if (typeof value !== 'string') throw new Error(`[cacheDb] Value must be a string. Got "${typeof value}" for key "${key}".`);
		// Set cache with optional TTL
		if (ttl) await this.client.set(key, value, { expiration: { type: 'EX', value: ttl } });
		else await this.client.set(key, value);
	}

	/**
	 * Saves a cache entry with an optional time-to-live (TTL).
	 * @param key The key of the cache entry to save.
	 * @param value The value of the cache entry to save. Must be a string.
	 * @param ttl Optional time-to-live (TTL) in seconds. Omit when not needed.
	 */
	public async setNew<T>(key: CacheDbKey, value: T, ttl?: number) {
		// Add the value to the CachedData object
		const cachedData: CachedData<T> = {
			data: value,
			timestamp: Dates.now('utc').unix_milliseconds,
		};
		// Set cache with optional TTL
		if (ttl) await this.client.set(key, JSON.stringify(cachedData), { expiration: { type: 'EX', value: ttl } });
		else await this.client.set(key, JSON.stringify(cachedData));
	}

	protected connectToClient() {
		return RedisDatabaseClient.getClient({ prefix: 'CACHEDB' });
	}

	/**
	 * Initializes the Redis client.
	 * @throws Will throw an error if the client initialization fails.
	 * @returns A promise that resolves when the initialization process is complete.
	 */
	protected async init() {
		// Skip if already initialized
		if (this.client) return;
		// Connect to the Redis client
		this.client = await this.connectToClient();
	}

	//
}

/* * */

export const cacheDb = asyncSingletonProxy(CacheDbClass);
