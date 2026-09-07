'use client';

import { BottomSheet } from '@/components/common/bottom-sheet/BottomSheet';
import { StopsDetailContextProvider } from '@/components/stops/detail/StopsDetail.context';
import { StopsDetailView } from '@/components/stops/detail/StopsDetailView';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';

/* * */

export function StopsDetail() {
	//

	//
	// A. Setup variables

	const { activeBottomSheet, closeActiveBottomSheet } = useBottomSheet();
	const isOpen = activeBottomSheet?.view === 'stops-detail';
	const activeStopId = isOpen ? activeBottomSheet?.entityId : null;

	//
	// B. Render components

	return (
		<BottomSheet
			onClose={closeActiveBottomSheet}
			opened={isOpen}
			withOverlay={false}
			mapAware
			withCompactCloseButton
			withHeaderBackground
		>
			{activeStopId && (
				<StopsDetailContextProvider stopId={activeStopId}>
					<StopsDetailView />
				</StopsDetailContextProvider>
			)}
		</BottomSheet>
	);
}
