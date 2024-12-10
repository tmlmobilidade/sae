'use client';

import Button from '@/components/common/Button';
import { useAlertDetailContext } from '@/components/context/AlertDetail.context';
import { Surface } from '@/components/layout/Surface';
import { MultiSelect, SegmentedControl, Title } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { Alert, AlertSchema } from '@tmlmobilidade/services/types';
import { useMemo } from 'react';

import AlertReferencesAgency from '../AlertReferencesAgency';
import AlertReferencesRoutes from '../AlertReferencesRoutes';
import AlertReferencesStops from '../AlertReferencesStops';
import styles from './styles.module.css';

export default function AlertReferences() {
	//
	// A. Get Data
	const { data, flags } = useAlertDetailContext();

	//
	// B. Transform Data
	const availableLiveMunicipalities = useMemo(() => {
		if (!data.municipalities) return [];

		return data.municipalities.map(municipality => ({
			label: municipality.name,

			// @ts-expect-error - This id is currently coming from the CMET API
			// should be fixed in the future to "_id" whenever it comes from @tmlmobilidade/services
			value: municipality.id,
		}));
	},
	[data.municipalities]);

	//
	// C. Handle Actions
	const handleSegmentedControlChange = (value: Alert['reference_type']) => {
		if (data.form.values.references.length > 0) {
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
					data.form.setFieldValue('reference_type', value);
					data.form.setFieldValue('references', []);
				},
				title: 'Tem certeza que deseja mudar a referência?',
			});
		}
		else {
			data.form.setFieldValue('reference_type', value);
		}
	};

	//
	// D. Render Components
	if (!data.form.values.reference_type) return null;

	return (
		<Surface className={styles.surface} padding="lg">
			<Title order={2}>Referências</Title>

			<MultiSelect
				data={availableLiveMunicipalities}
				description="Selecione os municípios que serão afetados pelo alerta."
				label="Municípios Afetados"
				nothingFoundMessage="Nenhum município encontrado"
				placeholder="Selecione os municípios"
				{...data.form.getInputProps('municipality_ids')}
				clearable
				readOnly={flags.isReadOnly}
				searchable
				value={data.form.values.municipality_ids || []}
			/>

			<SegmentedControl
				data={AlertSchema.shape.reference_type.options}
				onChange={handleSegmentedControlChange}
				value={data.form.values.reference_type}
			/>

			{data.form.values.reference_type === 'route' && <AlertReferencesRoutes />}
			{data.form.values.reference_type === 'stop' && <AlertReferencesStops />}
			{data.form.values.reference_type === 'agency' && <AlertReferencesAgency />}
		</Surface>
	);
}
