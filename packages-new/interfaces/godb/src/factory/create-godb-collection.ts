/* * */

import { type Db, type Document, type SimplifiedMongoIndex } from '@tmlmobilidade/go-clients-mongo';
import { z } from 'zod';

import { aggregate, aggregateCursor } from './methods/aggregate.js';
import { count } from './methods/count.js';
import { deleteById } from './methods/delete-by-id.js';
import { deleteMany } from './methods/delete-many.js';
import { deleteOne } from './methods/delete-one.js';
import { distinct } from './methods/distinct.js';
import { exists } from './methods/exists.js';
import { findById } from './methods/find-by-id.js';
import { findMany } from './methods/find-many.js';
import { findOne } from './methods/find-one.js';
import { getCollection } from './methods/get-collection.js';
import { insertManyUnsafe } from './methods/insert-many-unsafe.js';
import { insertMany } from './methods/insert-many.js';
import { insertOneUnsafe } from './methods/insert-one-unsafe.js';
import { insertOne } from './methods/insert-one.js';
import { toggleLockById } from './methods/toggle-lock-by-id.js';
import { updateById } from './methods/update-by-id.js';
import { type GoDbCollectionContext } from './types/godb-collection-context.type.js';
import { type GoDbCollection } from './types/godb-collection.type.js';

/* * */

interface CreateGoDbCollectionParams<T extends Document> {
	collectionName: string
	database: Db
	indexDescription: null | SimplifiedMongoIndex<T>[]
	schema: null | z.ZodSchema
}

/**
 * Creates a GoDB collection interface for a given collection.
 * @param params The parameters for the GoDB collection interface.
 * @returns The GoDB collection interface implementation.
 */
export function createGoDbCollection<T extends Document>({ collectionName, database, indexDescription, schema }: CreateGoDbCollectionParams<T>): GoDbCollection<T> {
	//

	const context: GoDbCollectionContext<T> = {
		collection: database.collection<T>(collectionName),
		collectionName,
		database,
		indexDescription,
		schema,
	};

	return {

		aggregate: (pipeline, options) => aggregate(context, pipeline, options),

		aggregateCursor: (pipeline, options) => aggregateCursor(context, pipeline, options),

		count: (filter, options) => count(context, filter, options),

		deleteById: (_id, clientSession) => deleteById(context, _id, clientSession),

		deleteMany: (filter, clientSession) => deleteMany(context, filter, clientSession),

		deleteOne: (filter, clientSession) => deleteOne(context, filter, clientSession),

		distinct: (key, filter) => distinct(context, key, filter),

		exists: (key, value, options) => exists(context, key, value, options),

		// existsById: id => existsById(context, id),

		findById: (_id, clientSession) => findById(context, _id, clientSession),

		findMany: (filter, clientSession) => findMany(context, filter, clientSession),

		findOne: (filter, clientSession) => findOne<T>(context, filter, clientSession),

		getCollection: () => getCollection(context),

		// getCollectionName: () => getCollectionName(context),

		insertMany: (docs, options) => insertMany(context, docs, options),

		insertManyUnsafe: (docs, options) => insertManyUnsafe(context, docs, options),

		insertOne: (doc, clientSession) => insertOne<T>(context, doc, clientSession),

		insertOneUnsafe: (doc, clientSession) => insertOneUnsafe<T>(context, doc, clientSession),

		// isLocked: filter => isLocked(context, filter),

		// isLockedById: id => isLockedById(context, id),

		toggleLockById: (_id, clientSession) => toggleLockById<T>(context, _id, clientSession),

		updateById: (_id, updateFields, clientSession) => updateById<T>(context, _id, updateFields, clientSession),

		// updateMany: (filter, updateFields, options) => updateMany(context, filter, updateFields, options),

		// updateOne: (filter, updateFields, options) => updateOne(context, filter, updateFields, options),
	};
}
