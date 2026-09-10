'use client';

import { useVehicleListExportContext, VehicleListExportContextProvider } from '@/contexts/VehicleExport.context';
import { DataProviders } from '@/providers/data-providers';
import { Button, closeModal, Divider, Grid, Label, openModal, Pane, Section, Spacer, Text, Toolbar } from '@tmlmobilidade/ui';

/* * */

const MODAL_ID = 'vehicle-list-export-modal';

/* * */

export function VehicleListExportModal() {
	//

	//
	// A. Setup variables

	const vehicleListExportContext = useVehicleListExportContext();

	//
	// B. Render components

	return (
		<Pane
			header={[
				<Toolbar key="vehicle-list-export-toolbar">
					<Label size="lg" singleLine>Exportar veículos</Label>
					<Spacer />
				</Toolbar>,
			]}
		>
			<Section gap="sm">
				<Label size="sm" caps>Filtros ativos na lista</Label>
				{vehicleListExportContext.filters.length === 0 && (
					<Label size="sm">Sem filtros ativos. A exportação irá usar todos os veículos da lista atual.</Label>
				)}
				{vehicleListExportContext.filters.map(({ label, value }) => (
					<div key={label}>
						<Label size="sm" caps>{label}</Label>
						<Text size="sm">{value}</Text>
					</div>
				))}
			</Section>
			<Divider />
			<Section gap="sm">
				<Grid columns="ab" gap="sm">
					<Button label="Cancelar" onClick={closeVehicleListExportModal} type="button" variant="secondary" />
					<Button
						disabled={!vehicleListExportContext.flags.canSave}
						label="Exportar"
						loading={vehicleListExportContext.flags.loading}
						onClick={vehicleListExportContext.actions.exportVehicles}
						type="button"
					/>
				</Grid>
			</Section>
		</Pane>
	);
}

/* * */

export const openVehicleListExportModal = (vehiclesListContext: any) => {
	openModal({
		children: (
			<DataProviders>
				<VehicleListExportContextProvider vehiclesListContext={vehiclesListContext}>
					<VehicleListExportModal />
				</VehicleListExportContextProvider>
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

export const closeVehicleListExportModal = () => {
	closeModal(MODAL_ID);
};
