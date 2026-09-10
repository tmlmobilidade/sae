'use client';

import { VehicleCreate } from '@/components/vehicles2/create/VehicleCreate';
import { VehicleCreateContextProvider } from '@/components/vehicles2/create/VehicleCreate.context';
import { DataProviders } from '@/providers/data-providers';
import { closeModal, openModal } from '@tmlmobilidade/ui';

/* * */

const MODAL_ID = 'create-vehicle-modal';

/* * */

export const openCreateVehicleModal = () => {
	openModal({
		children: (
			<DataProviders>
				<VehicleCreateContextProvider>
					<VehicleCreate />
				</VehicleCreateContextProvider>
			</DataProviders>
		),
		closeOnClickOutside: false,
		closeOnEscape: false,
		modalId: MODAL_ID,
		padding: 0,
		size: 'xl',
		withCloseButton: false,
	});
};

/* * */

export const closeCreateVehicleModal = () => {
	closeModal(MODAL_ID);
};
