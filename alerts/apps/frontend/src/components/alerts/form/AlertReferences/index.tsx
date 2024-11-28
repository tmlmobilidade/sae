import { AlertFormReferenceSectionOptions, useAlertDetailContext } from '@/components/context/AlertDetail.context';
import { Surface } from '@/components/layout/Surface';
import { MultiSelect, SegmentedControl, Title } from '@mantine/core';
import { useMemo } from 'react';

import styles from './styles.module.css';

export default function AlertReferences() {
	//
	// A. Get Data
	const alertDetailContext = useAlertDetailContext();

	//
	// B. Transform Data
	const availableLiveMunicipalities = useMemo(() => {
		if (!alertDetailContext.data.municipalities) return [];

		return alertDetailContext.data.municipalities.map(municipality => ({
			label: municipality.name,

			// @ts-expect-error - This id is currently coming from the CMET API
			// should be fixed in the future to "_id" whenever it comes from @tmlmobilidade/services
			value: municipality.id,
		}));
	},
	[alertDetailContext.data.municipalities]);

	return (
		<Surface className={styles.surface} padding="lg">
			<Title order={2}>Referências</Title>

			<MultiSelect
				data={availableLiveMunicipalities}
				description="Selecione os municípios que serão afetados pelo alerta."
				label="Municípios Afetados"
				nothingFoundMessage="Nenhum município encontrado"
				placeholder="Selecione os municípios"
				{...alertDetailContext.data.form.getInputProps('municipality_ids')}
				clearable
				readOnly={alertDetailContext.flags.isReadOnly}
				searchable
				value={alertDetailContext.data.form.values.municipality_ids}
			/>

			<SegmentedControl
				data={AlertFormReferenceSectionOptions}
				onChange={alertDetailContext.actions.setAlertFormReferenceSection}
				value={alertDetailContext.flags.formReferenceSection}
			/>

			{alertDetailContext.flags.formReferenceSection === 'lines' && <div>lines</div>}
			{alertDetailContext.flags.formReferenceSection === 'stops' && <div>stops</div>}
			{alertDetailContext.flags.formReferenceSection === 'agencies' && <div>agencies</div>}
		</Surface>
	);
}
