/* * */

import { type SimplifiedMongoIndex } from '@tmlmobilidade/go-clients-mongo';
import { type Ride } from '@tmlmobilidade/go-types-operation';

/**
 * **IMPORTANT**:
 * Automatic sorting (ESLint) of keys in the JS objects should be disabled.
 * The order of keys in a compound index is very important and should be
 * carefully considered based on the cardinality of each key.
 */
export const ridesIndexes: SimplifiedMongoIndex<Ride>[] = [
	{ key: { agency_id: 1, hashed_trip_id: 1, start_time_scheduled: 1 } },
	{ key: { agency_id: 1, route_short_name: 1, start_time_scheduled: 1 } },
	{ key: { agency_id: 1, shape_id: 1, start_time_scheduled: 1 } },
	// eslint-disable-next-line perfectionist/sort-objects
	{ key: { agency_id: 1, start_time_scheduled: -1, hashed_trip_id: 1 } },
	// eslint-disable-next-line perfectionist/sort-objects
	{ key: { agency_id: 1, trip_id: 1, start_time_scheduled: 1 } },
	{ key: { hash: 1 } },
	{ key: { hashed_shape_id: 1 } },
	{ key: { hashed_trip_id: 1 } },
	{ key: { operational_date: 1 } },
	{ key: { operational_date: 1, processing_status: 1 } },
	{ key: { plan_id: 1 } },
	{ key: { processing_status: 1 } },
	{ key: { processing_status: 1, start_time_scheduled: 1 } },
	{ key: { processing_status: 1, updated_at: 1 } },
	{ key: { shape_id: 1 } },
	{ key: { start_time_scheduled: 1 } },
];
