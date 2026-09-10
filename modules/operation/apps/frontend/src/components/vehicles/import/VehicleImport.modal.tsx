'use client';

import { VehicleImportContextProvider } from '@/contexts/VehicleImport.context';
import { DataProviders } from '@/providers/data-providers';
import { closeModal, MeContextProvider, openModal } from '@tmlmobilidade/ui';

import { VehicleImportFile } from './VehicleImportFile';

/* * */

const MODAL_ID = 'import-vehicle-modal';

/* * */

export const openImportVehicleModal = () => {
	openModal({
		children: (
			<MeContextProvider>
				<DataProviders>
					<VehicleImportContextProvider>
						<VehicleImportFile />
					</VehicleImportContextProvider>
				</DataProviders>
			</MeContextProvider>
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

export const closeImportVehicleModal = () => {
	closeModal(MODAL_ID);
};
