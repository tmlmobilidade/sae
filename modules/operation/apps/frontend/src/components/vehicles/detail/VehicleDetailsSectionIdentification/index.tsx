'use client';

import { AgencySelect } from '@/components/common/AgencySelect';
import { useVehiclesDetailContext } from '@/contexts/VehiclesDetail.context';
import { Collapsible, DateInput, Grid, Section, TextInput } from '@tmlmobilidade/ui';

/* * */

export function VehicleDetailsSectionIdentification() {
	//

	//
	// A. Setup variables

	const vehiclesDetailContext = useVehiclesDetailContext();

	//
	// B. Render components

	return (
		<Collapsible description="Identificadores do veículo, dono e operador." title="Identificação">
			<Section>
				<Grid columns="ab" gap="md">
					<TextInput
						label="ID do veículo"
						readOnly={true}
						{...vehiclesDetailContext.data.form.getInputProps('_id')}
					/>

					<TextInput
						key={vehiclesDetailContext.data.form.key('owner')}
						label="Dono do veículo"
						readOnly={vehiclesDetailContext.flags.read_only}
						{...vehiclesDetailContext.data.form.getInputProps('owner')}
					/>

					<AgencySelect
						key={vehiclesDetailContext.data.form.key('agency_id')}
						label="Operador do veículo"
						onChange={vehiclesDetailContext.data.form.getInputProps('agency_id').onChange}
						readOnly={vehiclesDetailContext.flags.read_only}
						selected={vehiclesDetailContext.data.form.values.agency_id}
					/>

					<DateInput
						key={vehiclesDetailContext.data.form.key('registration_date')}
						label="Data de registro do veículo"
						readOnly={vehiclesDetailContext.flags.read_only}
						{...vehiclesDetailContext.data.form.getInputProps('registration_date')}
					/>

					<DateInput
						key={vehiclesDetailContext.data.form.key('start_date')}
						label="Data de início de operação"
						readOnly={vehiclesDetailContext.flags.read_only}
						{...vehiclesDetailContext.data.form.getInputProps('start_date')}
					/>

					<TextInput
						key={vehiclesDetailContext.data.form.key('license_plate')}
						label="Placa do veículo"
						readOnly={vehiclesDetailContext.flags.read_only}
						{...vehiclesDetailContext.data.form.getInputProps('license_plate')}
					/>
				</Grid>
			</Section>
		</Collapsible>
	);

	//
}
