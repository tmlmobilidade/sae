/* * */

import { openCreateVehicleModal } from '@/components/vehicles2/create/VehicleCreate.modal';
import { openVehicleListExportModal } from '@/components/vehicles2/list/VehicleListExportModal/VehicleListExportModal';
import { useVehiclesListContext } from '@/contexts/VehiclesList.context';
import { IconFileDownload, IconPlus, IconUpload } from '@tabler/icons-react';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { Button, HasPermission, IconButton, Label, SearchField, Spacer, Toolbar } from '@tmlmobilidade/ui';

import { openImportVehicleModal } from '../../import/VehicleImport.modal';

/* * */

export function VehiclesListHeader() {
	//

	//
	// A. Setup variables

	const vehiclesListContext = useVehiclesListContext();

	//
	// B. Render components

	return (
		<Toolbar>
			<Label size="lg" caps singleLine>veículos</Label>
			<Spacer />
			<SearchField onChange={vehiclesListContext.filters.search.set} value={vehiclesListContext.filters.search.value} />
			<HasPermission action={PermissionCatalog.all.vehicles.actions.create} scope={PermissionCatalog.all.vehicles.scope}>
				<Button label="Novo veículo" leftSection={<IconPlus />} onClick={openCreateVehicleModal} />
			</HasPermission>
			<HasPermission action={PermissionCatalog.all.vehicles.actions.create} scope={PermissionCatalog.all.vehicles.scope}>
				<Button label="Importar veículo" leftSection={<IconUpload />} onClick={openImportVehicleModal} />
			</HasPermission>
			<IconButton icon={<IconFileDownload />} onClick={() => openVehicleListExportModal(vehiclesListContext)} tooltip="Exportar veículos" variant="secondary" />
		</Toolbar>
	);

	//
}
