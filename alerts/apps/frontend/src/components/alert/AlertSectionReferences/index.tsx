'use client';

/* * */

import {
	Button,
	Combobox,
	Section,
	SegmentedControl,
	Surface,
	Text,
} from '@tmlmobilidade/ui';
import styles from './styles.module.css';
import ReferenceCardLines from '../ReferenceCardLines';
import { useMemo } from 'react';
import { useLocationsContext } from '@/contexts/Locations.context';
import { useAlertDetailContext } from '@/contexts/AlertDetail.context';
import { IconPlus } from '@tabler/icons-react';

export default function AlertSectionReferences() {
	//
	// A. Setup variables
	const { data: locationsData } = useLocationsContext();
	const { data: alertDetailData, actions } = useAlertDetailContext();

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
	// B. Render components

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
					data={[
						{ label: 'Selecionar Linhas', value: 'lines' },
						{ label: 'Selecionar Paragens', value: 'stops' },
						{ label: 'Selecionar Agências', value: 'agencies' },
					]}
					fullWidth
				/>
				<div className={styles.referenceCardContainer}>
					{references.length === 0 ? (
						<Surface className={styles.empty} padding="md" borderRadius="sm">
							<Text>Não há referências disponíveis.</Text>	
						</Surface>
					) : (
						references.map((_, index) => (
							<ReferenceCardLines index={index} key={index} />
						))
					)}
					<Button
						className={styles.addButton}
						onClick={actions.addReference}
						variant="secondary"
					>
						<IconPlus size={18} />
						<div>Adicionar Linha</div>
					</Button>
				</div>
			</Surface>
		</Section>
	);
}
