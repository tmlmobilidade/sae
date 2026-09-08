/* * */

import { type StopId } from '@tmlmobilidade/go-types-infrastructure';
import { type PatternStopSearchItem } from '@tmlmobilidade/go-types-offer';

/* * */

interface CreateStopOptionsParams {
	excludeStopIds: StopId[]
	results: PatternStopSearchItem[]
	value: null | PatternStopSearchItem
}

/* * */

function normalizeStopId(stopId: StopId): string {
	return String(stopId);
}

export function createStopOptions({ excludeStopIds, results, value }: CreateStopOptionsParams) {
	const excludedIds = new Set(excludeStopIds.map(normalizeStopId));
	const seenIds = new Set<string>();
	const items: PatternStopSearchItem[] = [];

	for (const stop of results) {
		const stopId = normalizeStopId(stop._id);
		if (excludedIds.has(stopId) || seenIds.has(stopId)) continue;
		seenIds.add(stopId);
		items.push(stop);
	}

	if (value) {
		const selectedId = normalizeStopId(value._id);
		if (!seenIds.has(selectedId) && !excludedIds.has(selectedId)) {
			items.unshift(value);
		}
	}

	return items.map(stop => ({
		label: `${stop.name} (#${stop._id})`,
		value: normalizeStopId(stop._id),
	}));
}
