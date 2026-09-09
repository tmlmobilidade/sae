'use client';

import { BottomSheet } from '@/components/common/bottom-sheet/BottomSheet';
import { Search } from '@/components/search/Search';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';
import { clearSearchDraft } from '@/utils/search/search-draft';
import { useRef, useState } from 'react';

/* * */

export function SearchDetail() {
	//

	//
	// A. Setup variables

	const { activeBottomSheet, closeActiveBottomSheet } = useBottomSheet();
	const inputRef = useRef<HTMLInputElement>(null);
	const isOpen = activeBottomSheet?.view === 'search';
	const [isMounted, setIsMounted] = useState(isOpen);

	//
	// B. Handle actions

	const handleOpenEnd = () => {
		inputRef.current?.focus({ preventScroll: true });
	};

	const handleClose = () => {
		clearSearchDraft();
		closeActiveBottomSheet();
	};

	if (!isOpen && !isMounted) return null;

	//
	// C. Render components

	return (
		<BottomSheet
			avoidKeyboard={false}
			headerMode="handle"
			onClose={handleClose}
			onCloseEnd={() => setIsMounted(false)}
			onOpenEnd={handleOpenEnd}
			onOpenStart={() => setIsMounted(true)}
			opened={isOpen}
			size="full"
			snapPoints={[0, 1]}
			withCompactCloseButton
		>
			<Search inputRef={inputRef} />
		</BottomSheet>
	);
}
