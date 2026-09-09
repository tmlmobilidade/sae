let SEARCH_DRAFT = '';
const searchDraftListeners = new Set<() => void>();

/* * */

function emitSearchDraftChange() {
	searchDraftListeners.forEach(listener => listener());
}

/* * */

export function subscribeToSearchDraft(listener: () => void) {
	searchDraftListeners.add(listener);
	return () => {
		searchDraftListeners.delete(listener);
	};
}

export function getSearchDraft() {
	return SEARCH_DRAFT;
}

export function clearSearchDraft() {
	if (SEARCH_DRAFT === '') return;
	SEARCH_DRAFT = '';
	emitSearchDraftChange();
}

export function setSearchDraft(value: string) {
	if (SEARCH_DRAFT === value) return;
	SEARCH_DRAFT = value;
	emitSearchDraftChange();
}
