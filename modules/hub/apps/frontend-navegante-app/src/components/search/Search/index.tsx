'use client';

import { useRoutePlannerContext } from '@/components/routes/RoutePlanner.context';
import { SearchGroup } from '@/components/search/SearchGroup';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';
import { useSearch } from '@/hooks/search/useSearch';
import { type SearchResult } from '@/types/common/search';
import { type RoutePlannerLocation } from '@/types/route-planner/models';
import { mapHubStopToRoutePlannerLocation } from '@/utils/route-planner/planning/locations';
import { getSearchDraft, setSearchDraft, subscribeToSearchDraft } from '@/utils/search/search-draft';
import { IconSearch } from '@tabler/icons-react';
import { type RefObject, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

/* * */

interface SearchProps {
	inputRef?: RefObject<HTMLInputElement | null>
	locationPicker?: boolean
	onLocationSelect?: (location: RoutePlannerLocation) => void
	placeholder?: string
	variant?: 'sheet' | 'top'
}

export function Search({ inputRef: inputRefProp, locationPicker = false, onLocationSelect, placeholder, variant = 'sheet' }: SearchProps) {
	//

	// A. Setup variables

	const { t } = useTranslation();
	const { setActiveBottomSheet } = useBottomSheet();
	const routePlannerContext = useRoutePlannerContext();
	const searchDraft = useSyncExternalStore(subscribeToSearchDraft, getSearchDraft, getSearchDraft);
	const [locationPickerQuery, setLocationPickerQuery] = useState('');
	const query = locationPicker ? locationPickerQuery : searchDraft;
	const internalInputRef = useRef<HTMLInputElement>(null);
	const inputRef = inputRefProp ?? internalInputRef;
	const search = useSearch(query);
	const visibleGroups = locationPicker
		? search.groups.filter(group => group.key === 'poi' || group.key === 'stop')
		: search.groups;

	//
	// B. Handle actions

	const handleSelect = (result: SearchResult) => {
		if (locationPicker) {
			const location = getRoutePlannerLocation(result);
			if (location) onLocationSelect?.(location);
			return;
		}

		if (result.type === 'line') setActiveBottomSheet({ entityId: result.id, view: 'lines-detail' });
		if (result.type === 'stop') setActiveBottomSheet({ entityId: result.id, view: 'stops-detail' });
		if (result.type === 'alert') setActiveBottomSheet({ entityId: result.id, view: 'alerts-detail' });
		if (result.type === 'poi') void routePlannerContext.actions.openPlace(result.entity);
	};

	const handleQueryChange = (value: string) => {
		if (locationPicker) {
			setLocationPickerQuery(value);
			return;
		}

		setSearchDraft(value);
	};

	//
	// D. Render components

	return (
		<div className={styles.container} data-variant={variant}>
			<label className={styles.inputWrapper}>
				<IconSearch size={20} />
				<input ref={inputRef} autoFocus={variant === 'sheet'} onChange={event => handleQueryChange(event.currentTarget.value)} placeholder={placeholder ?? t('default:search.Search.placeholder')} type="search" value={query} />
			</label>

			{visibleGroups.map(group => (
				<SearchGroup key={group.key} group={group} onSelect={handleSelect} variant={variant} />
			))}

			{search.isLoading && <p className={styles.status}>{t('default:search.Search.loading')}</p>}
			{search.error && <p className={styles.status}>{search.error}</p>}
			{query.trim().length >= 2 && !search.isLoading && !search.error && visibleGroups.length === 0 && <p className={styles.status}>{t('default:search.Search.empty')}</p>}
		</div>
	);
}

/* * */

function getRoutePlannerLocation(result: SearchResult): null | RoutePlannerLocation {
	if (result.type === 'poi') return result.entity;
	if (result.type !== 'stop') return null;

	return mapHubStopToRoutePlannerLocation(result.entity, { ensureGtfsId: true });
}
