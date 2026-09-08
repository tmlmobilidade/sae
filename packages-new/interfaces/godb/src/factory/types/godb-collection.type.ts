/* * */

import type { AggregateOptions, AggregationCursor, AggregationPipeline, BulkWriteResult, Collection, DeleteResult, Document, Filter } from '@tmlmobilidade/go-clients-mongo';

import { type InsertableDocument } from './insertable-document.type.js';
import { type MinimalOptions } from './minimal-options.type.js';
import { type UpdatableDocument } from './updatable-document.type.js';

/**
 * The GoDB collection interface type.
 */
export interface GoDbCollection<T extends Document> {

	aggregate(pipeline: AggregationPipeline<T>, options?: AggregateOptions): Promise<T[]>

	aggregateCursor(pipeline: AggregationPipeline<T>, options?: AggregateOptions): Promise<AggregationCursor<T>>

	count(filter?: Filter<T>, options?: MinimalOptions): Promise<number>

	deleteById(_id: string, options?: MinimalOptions): Promise<DeleteResult>

	deleteMany(filter: Filter<T>, options?: MinimalOptions): Promise<DeleteResult>

	deleteOne(filter: Filter<T>, options?: MinimalOptions): Promise<DeleteResult>

	distinct<Key extends keyof T>(key: Key, filter?: Filter<T>): Promise<Array<T[Key]>>

	exists<Key extends keyof T>(key: Key, value: T[Key], options?: MinimalOptions): Promise<boolean>

	// existsById(id: string): Promise<boolean>

	findById(_id: string, options?: MinimalOptions): Promise<null | T>

	findMany(filter?: Filter<T>, options?: MinimalOptions): Promise<T[]>

	findOne(filter: Filter<T>, options?: Pick<MinimalOptions, 'projection' | 'session' | 'sort'>): Promise<null | T>

	getCollection(): Promise<Collection<T>>

	// getCollectionName(): string

	insertMany(docs: InsertableDocument<T>[], options?: MinimalOptions): Promise<T[]>

	insertOne(doc: InsertableDocument<T>, options?: MinimalOptions): Promise<T>

	insertOneUnsafe(doc: T, options?: MinimalOptions): Promise<T>

	/**
	 * Toggles the lock status of a document by its ID.
	 * @param _id The ID of the document to toggle the lock status of.
	 * @returns A promise that resolves to the result of the toggle operation.
	 */
	toggleLockById(id: string, options?: MinimalOptions): Promise<T>

	// isLocked(filter: Filter<T>): Promise<boolean>

	// isLockedById(id: string): Promise<boolean>

	updateById(_id: string, updateFields: UpdatableDocument<T>, options?: MinimalOptions): Promise<T>

	upsertManyUnsafe(docs: T[], options?: MinimalOptions): Promise<BulkWriteResult>

	// updateMany<TReturnDocument extends boolean = true>(filter: Filter<T>, updateFields: T & { updated_at?: UnixMilliseconds, updated_by?: string }, options?: UpdateOptions & { returnResults?: TReturnDocument }): Promise<TReturnDocument extends true ? WithId<T>[] : UpdateResult<T>>

	// updateOne<TReturnDocument extends boolean = true>(filter: Filter<T>, updateFields: T, options?: UpdateOptions & { forceIfLocked?: boolean, returnResult?: TReturnDocument }): Promise<TReturnDocument extends true ? WithId<T> : UpdateResult<T>>
}
