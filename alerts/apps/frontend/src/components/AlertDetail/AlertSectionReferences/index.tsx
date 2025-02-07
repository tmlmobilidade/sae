'use client';

/* * */

import { useAlertDetailContext } from '@/contexts/AlertDetail.context';
import { useLocationsContext } from '@/contexts/Locations.context';
import { Alert, AlertSchema } from '@tmlmobilidade/core-types';
import {
	Combobox,
	openConfirmModal,
	Section,
	SegmentedControl,
	Surface,
} from '@tmlmobilidade/ui';
import { useMemo } from 'react';

import AlertReferencesAgencies from '../AlertReferencesAgencies';
import AlertReferencesRoutes from '../AlertReferencesRoutes';
import AlertReferencesStops from '../AlertReferencesStops';

export default function AlertSectionReferences() {
	//
	// A. Setup variables
	const { data: locationsData } = useLocationsContext();
	const { data: alertDetailData } = useAlertDetailContext();

	//
	// B. Transform data
	const municipalitiesOptions = useMemo(() => {
		if (!locationsData.municipalities) return [];

		return locationsData.municipalities.map(municipality => ({
			label: municipality.name,
			value: municipality.id,
		}));
	}, [locationsData.municipalities]);

	const references = useMemo(() => alertDetailData.form.values.references, [
		alertDetailData.form.values.references,
	]);

	//
	// C. Handle Actions
	const parseOptionsLabel = (value: Alert['reference_type']) => {
		switch (value) {
			case 'agency':
				return { label: 'Agências', value };
			case 'route':
				return { label: 'Linhas', value };
			case 'stop':
				return { label: 'Paragens', value };
		}
	};

	const handleSegmentedControlChange = (value: Alert['reference_type']) => {
		if (references.length > 0) {
			openConfirmModal({
				centered: true,
				children: (
					<>
						<div>Você está prestes a perder as referências que já foram adicionadas.</div>
					</>
				),
				closeOnClickOutside: true,
				labels: { cancel: 'Cancelar', confirm: 'Continuar' },
				onConfirm: () => {
					alertDetailData.form.setFieldValue('reference_type', value);
					alertDetailData.form.setFieldValue('references', []);
				},
				title: 'Tem certeza que deseja mudar a referência?',
			});
		}
		else {
			alertDetailData.form.setFieldValue('reference_type', value);
		}
	};

	//
	// D. Render components

	return (
		<Section
			description="As referências (Linhas, Paragens, Municípios, Etc...) afetadas deste alerta."
			title="Referências"
		>
			<Surface gap="md" padding="sm">
				<Combobox
					key={alertDetailData.form.key('municipality_ids')}
					data={municipalitiesOptions}
					description="Selecione os munícios que serão afetados pelo alerta"
					label="Municípios Afetados"
					clearable
					fullWidth
					multiple
					searchable
					{...alertDetailData.form.getInputProps('municipality_ids')}
				/>

				<SegmentedControl
					data={AlertSchema.shape.reference_type.options.map(parseOptionsLabel)}
					onChange={(value: string) => handleSegmentedControlChange(value as Alert['reference_type'])}
					value={alertDetailData.form.values.reference_type}
					fullWidth
				/>

				{alertDetailData.form.values.reference_type === 'route' && <AlertReferencesRoutes />}
				{alertDetailData.form.values.reference_type === 'stop' && <AlertReferencesStops />}
				{alertDetailData.form.values.reference_type === 'agency' && <AlertReferencesAgencies />}

			</Surface>
		</Section>
	);
}
