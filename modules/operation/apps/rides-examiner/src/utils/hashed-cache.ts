/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';

import { type PickedHashedShape, type PickedHashedTrip } from '../types/analysis-data.js';
import { LABDB_QUERY_SETTINGS } from './labdb-query-settings.js';

/* * */

//
// Hashed shapes and hashed trips are content-addressed: the _id is a hash of the row contents,
// so a given _id can never resolve to different data. Every ride of the same pattern asks for the
// same hashed shape and trip, which made these two lookups a quarter of all examiner queries.
// Cache the resolved rows per process in a bounded LRU. In-flight lookups are cached as promises
// so that concurrent rides sharing a hash issue a single query. Empty or failed lookups are not
// cached, so a hash that is inserted later is picked up on the next ride.

const HASHED_SHAPES_CACHE_MAX_ENTRIES = 5_000; // ~3 KB per polyline → ~15 MB
const HASHED_TRIPS_CACHE_MAX_ENTRIES = 20_000; // ~30–60 stop rows per trip → ~40 MB

/* * */

export class LruCache<V> {
	//

	private readonly entries = new Map<string, V>();

	constructor(private readonly maxEntries: number) {
		if (!Number.isInteger(maxEntries) || maxEntries <= 0) throw new Error('LruCache: maxEntries must be a positive integer.');
	}

	get size(): number {
		return this.entries.size;
	}

	delete(key: string): void {
		this.entries.delete(key);
	}

	get(key: string): undefined | V {
		const value = this.entries.get(key);
		if (value === undefined) return undefined;
		// Refresh recency: Map iteration order is insertion order.
		this.entries.delete(key);
		this.entries.set(key, value);
		return value;
	}

	set(key: string, value: V): void {
		if (this.entries.has(key)) this.entries.delete(key);
		this.entries.set(key, value);
		if (this.entries.size > this.maxEntries) {
			const oldestKey = this.entries.keys().next().value;
			if (oldestKey !== undefined) this.entries.delete(oldestKey);
		}
	}

	//
}

/* * */

const hashedShapesCache = new LruCache<Promise<null | PickedHashedShape>>(HASHED_SHAPES_CACHE_MAX_ENTRIES);
const hashedTripsCache = new LruCache<Promise<PickedHashedTrip[]>>(HASHED_TRIPS_CACHE_MAX_ENTRIES);

/**
 * Resolves the hashed shape for the given hash, from the process cache when possible.
 * @param hashedShapeId The content hash of the shape.
 * @returns The picked hashed shape, or null if it does not exist in LabDB.
 */
export async function getHashedShape(hashedShapeId: string): Promise<null | PickedHashedShape> {
	const cached = hashedShapesCache.get(hashedShapeId);
	if (cached) return cached;

	const lookup = labDb.queryFromString<PickedHashedShape>(
		`
			SELECT shape_polyline
			FROM operation.hashed_shapes
			WHERE _id = $1
			ORDER BY updated_at DESC
			LIMIT 1 BY _id
			${LABDB_QUERY_SETTINGS}
		`,
		{ 1: hashedShapeId },
	).then((rows) => {
		if (rows.length === 0) {
			hashedShapesCache.delete(hashedShapeId);
			return null;
		}
		return rows[0];
	}).catch((error) => {
		hashedShapesCache.delete(hashedShapeId);
		throw error;
	});

	hashedShapesCache.set(hashedShapeId, lookup);
	return lookup;
}

/**
 * Resolves the hashed trip stops for the given hash, from the process cache when possible.
 * @param hashedTripId The content hash of the trip.
 * @returns The picked hashed trip rows (one per stop), or an empty array if it does not exist in LabDB.
 */
export async function getHashedTrip(hashedTripId: string): Promise<PickedHashedTrip[]> {
	const cached = hashedTripsCache.get(hashedTripId);
	if (cached) return cached;

	const lookup = labDb.queryFromString<PickedHashedTrip>(
		`
			SELECT stop_id, stop_lat, stop_lon, stop_sequence
			FROM operation.hashed_trips
			WHERE _id = $1
			ORDER BY updated_at DESC
			LIMIT 1 BY _id, stop_id, stop_sequence
			${LABDB_QUERY_SETTINGS}
		`,
		{ 1: hashedTripId },
	).then((rows) => {
		if (rows.length === 0) hashedTripsCache.delete(hashedTripId);
		return rows;
	}).catch((error) => {
		hashedTripsCache.delete(hashedTripId);
		throw error;
	});

	hashedTripsCache.set(hashedTripId, lookup);
	return lookup;
}

/**
 * Current cache occupancy, for logging.
 */
export function getHashedCacheStats(): { shapes: number, trips: number } {
	return { shapes: hashedShapesCache.size, trips: hashedTripsCache.size };
}
