'use client';

import { AgencySelect } from '@/components/common/AgencySelect';
import { useVehicleCreateContext } from '@/components/vehicles/create/VehicleCreate.context';
import { Translations } from '@/lib/translations';
import { VehicleEmissionValues, VehiclePropulsionValues, vehicleSchema, VehicleTypeValues } from '@tmlmobilidade/go-types-operation';
import { Checkbox, DateInput, NumberInput, Section, Select, Spacer, TextInput } from '@tmlmobilidade/ui';

/* * */

export function VehicleCreateInfos() {
	//

	//
	// A. Setup variables

	const vehicleCreateContext = useVehicleCreateContext();

	//
	// B. Render Components

	return (
		<Section gap="md">

			<NumberInput
				key={vehicleCreateContext.data.form.key(String('_id'))}
				label="ID do veículo"
				maxLength={5}
				placeholder="Introduza o ID do veículo"
				required={!vehicleSchema.shape._id.isOptional()}
				w="100%"
				onChange={(event) => {
					const value = event.toString(); // only numbers
					vehicleCreateContext.data.form.getInputProps('_id').onChange(value);
					vehicleCreateContext.data.form.getInputProps('vehicle_id').onChange(value);
				}}
			/>

			<TextInput
				key={vehicleCreateContext.data.form.key('owner')}
				label="Dono do veículo"
				placeholder="Introduza o dono do veículo"
				required={!vehicleSchema.shape.owner.isOptional()}
				w="100%"
				{...vehicleCreateContext.data.form.getInputProps('owner')}
			/>

			<AgencySelect
				key={vehicleCreateContext.data.form.key('agency_id')}
				label="Operador do veículo"
				onChange={vehicleCreateContext.data.form.getInputProps('agency_id').onChange}
				selected={vehicleCreateContext.data.form.values.agency_id}
			/>

			<Spacer size="md" />

			<DateInput
				key={vehicleCreateContext.data.form.key('registration_date')}
				label="Data de registro do veículo"
				{...vehicleCreateContext.data.form.getInputProps('registration_date')}
			/>

			<DateInput
				key={vehicleCreateContext.data.form.key('start_date')}
				label="Data de início de operação"
				required={!vehicleSchema.shape.start_date.isOptional()}
				{...vehicleCreateContext.data.form.getInputProps('start_date')}
			/>

			<TextInput
				key={vehicleCreateContext.data.form.key('license_plate')}
				label="Matrícula do veículo"
				maxLength={6}
				placeholder="AA00AA"
				required={!vehicleSchema.shape.license_plate.isOptional()}
				w="100%"
				{...vehicleCreateContext.data.form.getInputProps('license_plate')}
				onChange={(event) => {
					const value = event.currentTarget.value.toUpperCase();
					vehicleCreateContext.data.form.getInputProps('license_plate').onChange(value);
				}}
			/>

			<TextInput
				key={vehicleCreateContext.data.form.key('make')}
				label="Marca do veículo"
				placeholder="Introduza a marca do veículo"
				required={!vehicleSchema.shape.make.isOptional()}
				w="100%"
				{...vehicleCreateContext.data.form.getInputProps('make')}
			/>

			<TextInput
				key={vehicleCreateContext.data.form.key('model')}
				label="Modelo do veículo"
				placeholder="Introduza o modelo do veículo"
				required={!vehicleSchema.shape.model.isOptional()}
				w="100%"
				{...vehicleCreateContext.data.form.getInputProps('model')}
			/>

			<NumberInput
				key={vehicleCreateContext.data.form.key('available_seats')}
				label="Capacidade de assentos"
				placeholder="Introduza a capacidade de assentos"
				required={!vehicleSchema.shape.available_seats.isOptional()}
				w="100%"
				{...vehicleCreateContext.data.form.getInputProps('available_seats')}
			/>

			<NumberInput
				key={vehicleCreateContext.data.form.key('available_standing')}
				label="Capacidade de pé"
				placeholder="Introduza a capacidade de pé"
				required={!vehicleSchema.shape.available_standing.isOptional()}
				w="100%"
				{...vehicleCreateContext.data.form.getInputProps('available_standing')}
			/>

			<Spacer size="sm" />

			<Checkbox
				key={vehicleCreateContext.data.form.key('bicycles')}
				label="Aceita bicicletas"
				{...vehicleCreateContext.data.form.getInputProps('bicycles', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('contactless')}
				label="Aceita pagamento por aproximação"
				{...vehicleCreateContext.data.form.getInputProps('contactless', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('passenger_counting')}
				label="Contem contagem de passageiros"
				{...vehicleCreateContext.data.form.getInputProps('passenger_counting', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('climatization')}
				label="Possui climatização"
				{...vehicleCreateContext.data.form.getInputProps('climatization', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('wheelchair')}
				label="Acessível para cadeirantes"
				{...vehicleCreateContext.data.form.getInputProps('wheelchair', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('corridor')}
				label="Possui corredor"
				{...vehicleCreateContext.data.form.getInputProps('corridor', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('lowered_floor')}
				label="Piso rebaixado"
				{...vehicleCreateContext.data.form.getInputProps('lowered_floor', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('ramp')}
				label="Possui rampa"
				{...vehicleCreateContext.data.form.getInputProps('ramp', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('folding_system')}
				label="Sistema de ajoelhamento/dobragem"
				{...vehicleCreateContext.data.form.getInputProps('folding_system', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('kneeling')}
				label="Kneeling"
				{...vehicleCreateContext.data.form.getInputProps('kneeling', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('static_information')}
				label="Informação estática"
				{...vehicleCreateContext.data.form.getInputProps('static_information', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('onboard_monitor')}
				label="Monitor a bordo"
				{...vehicleCreateContext.data.form.getInputProps('onboard_monitor', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('front_display')}
				label="Display frontal"
				{...vehicleCreateContext.data.form.getInputProps('front_display', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('rear_display')}
				label="Display traseiro"
				{...vehicleCreateContext.data.form.getInputProps('rear_display', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('side_display')}
				label="Display lateral"
				{...vehicleCreateContext.data.form.getInputProps('side_display', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('internal_sound')}
				label="Som interno"
				{...vehicleCreateContext.data.form.getInputProps('internal_sound', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('external_sound')}
				label="Som externo"
				{...vehicleCreateContext.data.form.getInputProps('external_sound', { type: 'checkbox' })}
			/>

			<Checkbox
				key={vehicleCreateContext.data.form.key('consumption_meter')}
				label="Medição de consumo"
				{...vehicleCreateContext.data.form.getInputProps('consumption_meter', { type: 'checkbox' })}
			/>

			<Spacer size="sm" />

			<Select
				key={vehicleCreateContext.data.form.key('typology')}
				label="Tipologia"
				placeholder="Selecione a tipologia do veículo"
				w="100%"
				data={VehicleTypeValues.map(value => ({
					label: Translations.TYPOLOGY[value],
					value,
				}))}
				{...vehicleCreateContext.data.form.getInputProps('typology')}
			/>

			<Select
				key={vehicleCreateContext.data.form.key('propulsion')}
				label="Propulsão"
				placeholder="Selecione a propulsão do veículo"
				w="100%"
				data={VehiclePropulsionValues.map(value => ({
					label: Translations.PROPUNSIONAL[value],
					value: value,
				}))}
				{...vehicleCreateContext.data.form.getInputProps('propulsion')}
			/>

			<Select
				key={vehicleCreateContext.data.form.key('emission')}
				label="Classe de emissão"
				placeholder="Selecione a classe de emissão do veículo"
				w="100%"
				data={VehicleEmissionValues.map(value => ({
					label: Translations.EMISSION[value],
					value: value,
				}))}
				{...vehicleCreateContext.data.form.getInputProps('emission')}
			/>

		</Section>
	);
}
