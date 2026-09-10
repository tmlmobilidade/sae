'use client';

import { BottomSheet } from '@/components/common/bottom-sheet/BottomSheet';
import { LinesDetailView } from '@/components/lines/detail/LinesDetailView';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';

/* * */

export function LinesDetail() {
	//

	//
	// A. Setup variables

	const { activeBottomSheet, pop } = useBottomSheet();
	const isOpen = activeBottomSheet?.view === 'lines-detail';
	const activeLineId = isOpen ? activeBottomSheet?.entityId : null;

	// B. Render components

	return (
		<BottomSheet
			onClose={pop}
			opened={isOpen}
			withOverlay={false}
			mapAware
			withCompactCloseButton
			withHeaderBackground
		>
			{activeLineId && <LinesDetailView />}
		</BottomSheet>
	);
}
