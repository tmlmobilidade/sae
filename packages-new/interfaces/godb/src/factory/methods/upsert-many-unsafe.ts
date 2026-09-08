/* * */

import { type BulkWriteResult, type Document } from '@tmlmobilidade/go-clients-mongo';

import { type GoDbCollectionContext } from '../types/godb-collection-context.type.js';
import { type MinimalOptions } from '../types/minimal-options.type.js';

/**
 * Upserts multiple documents into the collection.
 * @param context The collection context.
 * @param docs The documents to upsert.
 * @param options The options for the upsert operation.
 * @returns A promise that resolves to the result of the upsert operation.
 */
export async function upsertManyUnsafe<T extends Document>(context: GoDbCollectionContext<T>, docs: T[], options?: MinimalOptions): Promise<BulkWriteResult> {
	return await context.collection.bulkWrite(
		docs.map(doc => ({
			replaceOne: {
				filter: { _id: doc._id },
				replacement: doc,
				upsert: true,
			},
		})),
		{ session: options?.session },
	);
}
