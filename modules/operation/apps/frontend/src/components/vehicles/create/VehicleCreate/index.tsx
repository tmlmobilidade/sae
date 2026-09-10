'use client';

import { VehicleCreateModalHeader } from '@/components/vehicles/create/VehicleCreateModalHeader';
import { Pane } from '@tmlmobilidade/ui';

import { VehicleCreateInfos } from '../VehicleCreateInfos';

/* * */

export function VehicleCreate() {
	return (
		<Pane header={[<VehicleCreateModalHeader />]}>
			<VehicleCreateInfos />
		</Pane>
	);
}
