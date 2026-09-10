'use client';

import { BottomSheet } from '@/components/common/bottom-sheet/BottomSheet';
import { VehiclesDetailContextProvider } from '@/components/vehicles/detail/VehiclesDetail.context';
import { VehiclesDetailView } from '@/components/vehicles/detail/VehiclesDetailView';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';

/* * */

export function VehiclesDetail() {
	//

	//
	// A. Setup variables

	const { activeBottomSheet, pop } = useBottomSheet();
	const isOpen = activeBottomSheet?.view === 'vehicles-detail';
	const activeVehicleId = isOpen ? activeBottomSheet?.entityId : null;

	//
	// B. Render componentss

	return (
		<BottomSheet
			onClose={pop}
			opened={isOpen}
			size="fit"
			withOverlay={false}
		>
			{activeVehicleId && (
				<VehiclesDetailContextProvider vehicleId={activeVehicleId}>
					<VehiclesDetailView />
				</VehiclesDetailContextProvider>
			)}
		</BottomSheet>
	);
}
