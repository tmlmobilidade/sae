/* * */

import { type SimplifiedMongoIndex } from '@tmlmobilidade/go-clients-mongo';
import { type RideWithAnalyses } from '@tmlmobilidade/go-types-operation';

/* * */

/**
 * **IMPORTANT**:
 * Automatic sorting (ESLint) of keys in the JS objects should be disabled.
 * The order of keys in a compound index is very important and should be
 * carefully considered based on the cardinality of each key.
 */
export const ridesIndexes: SimplifiedMongoIndex<RideWithAnalyses>[] = [
	{ key: { hashed_trip_id: 1 } },
	{ key: { hashed_shape_id: 1 } },
	{ key: { operational_date: 1 } },
	{ key: { operational_date: 1, system_status: 1 } },
	{ key: { start_time_scheduled: 1 } },
	{ key: { system_status: 1 } },
	// eslint-disable-next-line perfectionist/sort-objects
	{ key: { system_status: 1, start_time_scheduled: 1 } },
	// eslint-disable-next-line perfectionist/sort-objects
	{ key: { trip_id: 1, start_time_scheduled: 1 } },
	{ key: { plan_id: 1 } },
	{ key: { shape_id: 1 } },
	{ key: { agency_id: 1, route_short_name: 1, start_time_scheduled: 1 } },
	// eslint-disable-next-line perfectionist/sort-objects
	{ key: { agency_id: 1, start_time_scheduled: -1, hashed_trip_id: 1 } },
	{ key: { agency_id: 1, hashed_trip_id: 1, start_time_scheduled: 1 } },
];
