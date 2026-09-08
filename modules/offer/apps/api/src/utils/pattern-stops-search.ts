/* * */

import { type Filter } from '@tmlmobilidade/go-clients-mongo';
import { type Stop } from '@tmlmobilidade/go-types-infrastructure';

/* * */

export const PATTERN_STOPS_SEARCH_PROJECTION = Object.freeze({
	_id: 1,
	name: 1,
});

/* * */

export function escapePatternStopsSearchQuery(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function createPatternStopsSearchFilter(query: string): Filter<Stop> {
	const searchExpression = new RegExp(escapePatternStopsSearchQuery(query), 'i');

	return {
		$or: [
			{ _id: searchExpression },
			{ name: searchExpression },
		],
	};
}
