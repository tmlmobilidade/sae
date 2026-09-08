/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type HashedShape, type HashedTrip, type Ride } from '@tmlmobilidade/go-types-operation';
import { BatchWriter } from '@tmlmobilidade/go-utils-exec';

/* * */

export const ridesWriter = new BatchWriter<Ride>({
	batch_size: 10_000,
	insertFn: async (data) => {
		await goDb.operation.rides.upsertManyUnsafe(data);
		await labDb.operation.rides.insert('JSONEachRow', data);
	},
	title: await labDb.operation.rides.getTableName(),
});

export const hashedShapesWriter = new BatchWriter<HashedShape>({
	batch_size: 2_000,
	insertFn: async (data) => {
		await labDb.operation.hashedShapes.insert('JSONEachRow', data);
	},
	title: await labDb.operation.hashedShapes.getTableName(),
});

export const hashedTripsWriter = new BatchWriter<HashedTrip>({
	batch_size: 10_000,
	insertFn: async (data) => {
		await labDb.operation.hashedTrips.insert('JSONEachRow', data);
	},
	title: await labDb.operation.hashedTrips.getTableName(),
});
