'use client';

import { useVehiclesDetailContext } from '@/contexts/VehiclesDetail.context';
import { Checkbox, Collapsible, ErrorDisplay, Grid, LoadingOverlay, Section } from '@tmlmobilidade/ui';

/* * */

export function VehicleDetailsSectionFunctionalities() {
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
		<Collapsible description="Funcionalidades do veículo, como aceitação de bicicletas, pagamento com contactless, contagem de passageiros, etc..." title="Funcionalidades">
			<Section>
				<Grid columns="a" gap="sm">
					<Checkbox
						key={vehiclesDetailContext.data.form.key('bicycles')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Aceita bicicletas"
						{...vehiclesDetailContext.data.form.getInputProps('bicycles', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('contactless')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Aceita pagamento por aproximação"
						{...vehiclesDetailContext.data.form.getInputProps('contactless', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('passenger_counting')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Contagem de passageiros ativa"
						{...vehiclesDetailContext.data.form.getInputProps('passenger_counting', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('climatization')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Possui climatização"
						{...vehiclesDetailContext.data.form.getInputProps('climatization', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('wheelchair')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Acessível para cadeirantes"
						{...vehiclesDetailContext.data.form.getInputProps('wheelchair', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('corridor')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Possui corredor"
						{...vehiclesDetailContext.data.form.getInputProps('corridor', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('lowered_floor')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Piso rebaixado"
						{...vehiclesDetailContext.data.form.getInputProps('lowered_floor', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('ramp')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Possui rampa"
						{...vehiclesDetailContext.data.form.getInputProps('ramp', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('folding_system')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Sistema de dobragem"
						{...vehiclesDetailContext.data.form.getInputProps('folding_system', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('kneeling')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Kneeling"
						{...vehiclesDetailContext.data.form.getInputProps('kneeling', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('static_information')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Informação estática"
						{...vehiclesDetailContext.data.form.getInputProps('static_information', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('onboard_monitor')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Monitor a bordo"
						{...vehiclesDetailContext.data.form.getInputProps('onboard_monitor', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('front_display')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Display frontal"
						{...vehiclesDetailContext.data.form.getInputProps('front_display', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('rear_display')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Display traseiro"
						{...vehiclesDetailContext.data.form.getInputProps('rear_display', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('side_display')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Display lateral"
						{...vehiclesDetailContext.data.form.getInputProps('side_display', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('internal_sound')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Som interno"
						{...vehiclesDetailContext.data.form.getInputProps('internal_sound', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('external_sound')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Som externo"
						{...vehiclesDetailContext.data.form.getInputProps('external_sound', { type: 'checkbox' })}
					/>

					<Checkbox
						key={vehiclesDetailContext.data.form.key('consumption_meter')}
						disabled={vehiclesDetailContext.flags.read_only}
						label="Medição de consumo"
						{...vehiclesDetailContext.data.form.getInputProps('consumption_meter', { type: 'checkbox' })}
					/>
				</Grid>
			</Section>
		</Collapsible>
	);

	//
}
