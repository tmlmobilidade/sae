'use client';

import { useVehiclesDetailContext } from '@/contexts/VehiclesDetail.context';
import { Translations } from '@/lib/translations';
import { VehicleEmissionValues, VehiclePropulsionValues, VehicleTypeValues } from '@tmlmobilidade/go-types-operation';
import { Collapsible, ErrorDisplay, Grid, LoadingOverlay, NumberInput, Section, Select, TextInput } from '@tmlmobilidade/ui';

/* * */

export function VehicleDetailsSectionSpecifications() {
	//

	//
	// A. Setup variables

	const vehiclesDetailContext = useVehiclesDetailContext();

	//
	// B. Render components

	if (vehiclesDetailContext.flags.loading) {
		return <LoadingOverlay />;
	}

	if (vehiclesDetailContext.flags.error) {
		return <ErrorDisplay message={vehiclesDetailContext.flags.error.message} />;
	}

	return (
		<Collapsible description="Especificações do veículo, como marca, modelo, capacidade de assentos, etc..." title="Especificações">
			<Section>
				<Grid columns="ab" gap="md">
					<TextInput
						key={vehiclesDetailContext.data.form.key('make')}
						label="Marca do veículo"
						readOnly={vehiclesDetailContext.flags.read_only}
						{...vehiclesDetailContext.data.form.getInputProps('make')}
					/>

					<TextInput
						key={vehiclesDetailContext.data.form.key('model')}
						label="Modelo do veículo"
						readOnly={vehiclesDetailContext.flags.read_only}
						{...vehiclesDetailContext.data.form.getInputProps('model')}
					/>

					<NumberInput
						key={vehiclesDetailContext.data.form.key('available_seats')}
						label="Capacidade de assentos"
						readOnly={vehiclesDetailContext.flags.read_only}
						{...vehiclesDetailContext.data.form.getInputProps('available_seats')}
					/>

					<NumberInput
						key={vehiclesDetailContext.data.form.key('available_standing')}
						label="Capacidade de pé"
						readOnly={vehiclesDetailContext.flags.read_only}
						{...vehiclesDetailContext.data.form.getInputProps('available_standing')}
					/>

					<Select
						key={vehiclesDetailContext.data.form.key('typology')}
						data={VehicleTypeValues.map(value => ({ label: Translations.TYPOLOGY[value], value }))}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Tipologia"
						{...vehiclesDetailContext.data.form.getInputProps('typology')}
					/>

					<Select
						key={vehiclesDetailContext.data.form.key('propulsion')}
						data={VehiclePropulsionValues.map(value => ({ label: Translations.PROPUNSIONAL[value], value }))}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Propulsão"
						{...vehiclesDetailContext.data.form.getInputProps('propulsion')}
					/>

					<Select
						key={vehiclesDetailContext.data.form.key('emission')}
						data={VehicleEmissionValues.map(value => ({ label: Translations.EMISSION[value], value }))}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Classe de emissão"
						{...vehiclesDetailContext.data.form.getInputProps('emission')}
					/>
				</Grid>
			</Section>
		</Collapsible>

	);

	//
}
