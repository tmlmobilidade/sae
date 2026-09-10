'use client';

import { useVehiclesDetailContext } from '@/contexts/VehiclesDetail.context';
import { IconUpload } from '@tabler/icons-react';
import { PAGE_ROUTES } from '@tmlmobilidade/consts';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { Button, CloseButton, DeleteButton, HasPermission, IdTag, LockButton, Spacer, Toolbar } from '@tmlmobilidade/ui';
import { keepUrlParams } from '@tmlmobilidade/ui';
import { useRouter } from 'next/navigation';

/* * */

export function VehicleDetailsHeader() {
	//

	//
	// A. Setup variables

	const router = useRouter();
	const vehiclesDetailContext = useVehiclesDetailContext();

	//
	// B. Handle actions

	const handleClose = () => {
		router.push(keepUrlParams(PAGE_ROUTES.operation.VEHICLES_LIST));
	};

	//
	// C. Render components

	return (
		<Toolbar>

			<CloseButton onClick={handleClose} type="close" />

			<IdTag id={vehiclesDetailContext.data.vehicle?._id} copyOnClick />

			<Spacer />

			<HasPermission
				action={PermissionCatalog.all.vehicles.actions.lock}
				resourceKey="agency_ids"
				scope={PermissionCatalog.all.vehicles.scope}
				value={vehiclesDetailContext.data.vehicle?.agency_id}
			>
				<LockButton
					isLocked={vehiclesDetailContext.data.vehicle?.is_locked}
					onClick={vehiclesDetailContext.actions.toggleLock}
				/>
			</HasPermission>

			<HasPermission
				action={PermissionCatalog.all.vehicles.actions.update}
				resourceKey="agency_ids"
				scope={PermissionCatalog.all.vehicles.scope}
				value={vehiclesDetailContext.data.vehicle?.agency_id}
			>
				<Button
					disabled={vehiclesDetailContext.flags.read_only || vehiclesDetailContext.flags.saving || !vehiclesDetailContext.data.form.isDirty()}
					icon={<IconUpload size={28} />}
					label="Guardar"
					loading={vehiclesDetailContext.flags.saving}
					onClick={vehiclesDetailContext.actions.saveVehicle}
					variant="primary"
				/>
			</HasPermission>

			<HasPermission
				action={PermissionCatalog.all.vehicles.actions.delete}
				resourceKey="agency_ids"
				scope={PermissionCatalog.all.vehicles.scope}
				value={vehiclesDetailContext.data.vehicle?.agency_id}
			>
				<DeleteButton
					confirmMessage="Tem a certeza que deseja apagar este veículo? Esta ação não pode ser revertida."
					confirmTitle="Apagar Veículo"
					onDelete={vehiclesDetailContext.actions.deleteVehicle}
					showConfirmation
				/>
			</HasPermission>

		</Toolbar>
	);

	//
}
