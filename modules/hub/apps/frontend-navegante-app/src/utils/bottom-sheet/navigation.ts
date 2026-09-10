import { type BottomSheetNavigationEntry } from '@/types/common/bottom-sheet';

/* * */

export type BottomSheetNavigationAction =
  | { entry: BottomSheetNavigationEntry, type: 'push' }
  | { entry: BottomSheetNavigationEntry, type: 'replace-active' }
  | { type: 'clear' }
  | { type: 'pop' };

/* * */

export function reduceBottomSheetNavigation(stack: BottomSheetNavigationEntry[], action: BottomSheetNavigationAction): BottomSheetNavigationEntry[] {
	if (action.type === 'clear') return stack.length > 0 ? [] : stack;
	if (action.type === 'pop') return stack.length > 0 ? stack.slice(0, -1) : stack;

	const entry = normalizeBottomSheetNavigationEntry(action.entry);
	if (action.type === 'push') return [...stack, entry];
	if (stack.length === 0) return [entry];

	return [...stack.slice(0, -1), entry];
}

/* * */

function normalizeBottomSheetNavigationEntry(entry: BottomSheetNavigationEntry): BottomSheetNavigationEntry {
	return { entityId: entry.entityId ?? null, view: entry.view };
}
