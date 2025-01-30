'use client';

/* * */

import {
	Combobox,
	Section,
	SegmentedControl,
	Surface,
	openConfirmModal,
} from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import { useLocationsContext } from '@/contexts/Locations.context';
import { useAlertDetailContext } from '@/contexts/AlertDetail.context';
import { Alert, AlertSchema } from '@tmlmobilidade/core-types';
import AlertReferencesRoutes from '../AlertReferencesRoutes';
import AlertReferencesStops from '../AlertReferencesStops';
import AlertReferencesAgencies from '../AlertReferencesAgencies';

export default function AlertSectionReferences() {
	//
	// A. Setup variables
	const { data: locationsData } = useLocationsContext();
	const { data: alertDetailData } = useAlertDetailContext();

	//
	// B. Transform data
	const municipalitiesOptions = useMemo(() => {
		if (!locationsData.municipalities) return [];

		return locationsData.municipalities.map((municipality) => ({
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
			case 'route':
				return { label: 'Linhas', value };
			case 'stop':
				return { label: 'Paragens', value };
			case 'agency':
				return { label: 'Agências', value };
		}
	}

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
			title="Referências"
			description="As referências (Linhas, Paragens, Municípios, Etc...) afetadas deste alerta."
		>
			<Surface padding="sm" gap="md">
				<Combobox
					label="Municípios Afetados"
					description="Selecione os munícios que serão afetados pelo alerta"
					data={municipalitiesOptions}
					searchable
					multiple
					clearable
					fullWidth
					key={alertDetailData.form.key('municipality_ids')}
					{...alertDetailData.form.getInputProps('municipality_ids')}
				/>

				<SegmentedControl
					value={alertDetailData.form.values.reference_type}
					onChange={handleSegmentedControlChange as any}
					data={AlertSchema.shape.reference_type.options.map(parseOptionsLabel)}
					fullWidth
				/>
				
				{alertDetailData.form.values.reference_type === 'route' && <AlertReferencesRoutes />}
				{alertDetailData.form.values.reference_type === 'stop' && <AlertReferencesStops />}
				{alertDetailData.form.values.reference_type === 'agency' && <AlertReferencesAgencies />}

			</Surface>
		</Section>
	);
}
