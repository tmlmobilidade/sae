'use client';

import { BottomSheet } from '@/components/common/bottom-sheet/ReactModalSheet';
import { useBottomSheet } from '@/components/common/bottom-sheet/use-bottom-sheet';
import { VehiclesDetailContextProvider } from '@/components/vehicles/detail/VehiclesDetail.context';
import { VehiclesDetailView } from '@/components/vehicles/detail/VehiclesDetailView';

/* * */

export function VehiclesDetail() {
	//

	//
	// A. Setup variables

	const { activeBottomSheet, closeActiveBottomSheet } = useBottomSheet();

	//
	// B. Render componentss

	return (
		<BottomSheet
			allowBackgroundInteraction={true}
			onClose={closeActiveBottomSheet}
			opened={activeBottomSheet?.view === 'vehicles-detail'}
			size="short"
		>
			{activeBottomSheet?.entityId && (
				<VehiclesDetailContextProvider vehicleId={activeBottomSheet.entityId}>
					<VehiclesDetailView />
				</VehiclesDetailContextProvider>
			)}
		</BottomSheet>
	);
}
