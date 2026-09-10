'use client';

import { VehicleCreateContext } from '@/components/vehicles2/create/VehicleCreate.context';
import { closeCreateVehicleModal } from '@/components/vehicles2/create/VehicleCreate.modal';
import { IconUpload } from '@tabler/icons-react';
import { Button, CloseButton, Spacer, Tag, Toolbar } from '@tmlmobilidade/ui';
import { useContext } from 'react';

/* * */

export function VehicleCreateModalHeader() {
	//

	//
	// A. Setup variables

	const vehicleCreateContext = useContext(VehicleCreateContext);
	const hasCreateContext = !!vehicleCreateContext;

	//
	// B. Render components

	return (
		<Toolbar>
			<CloseButton onClick={closeCreateVehicleModal} type="close" />
			<Tag label="Novo Veículo" variant="muted" />
			<Spacer />
			<Button
				disabled={!hasCreateContext || !vehicleCreateContext.data.form.isValid()}
				icon={<IconUpload size={28} />}
				label="Publicar"
				loading={hasCreateContext ? vehicleCreateContext.flags.isSaving : false}
				onClick={hasCreateContext ? vehicleCreateContext.actions.createVehicle : undefined}
				variant="primary"
			/>
		</Toolbar>
	);

	//
}
