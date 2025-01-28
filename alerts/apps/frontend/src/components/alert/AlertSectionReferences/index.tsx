'use client';

/* * */

import { Combobox, Section, SegmentedControl, Surface } from '@tmlmobilidade/ui';
import styles from './styles.module.css';
import ReferenceCard from '../ReferenceCard';
import { useMemo } from 'react';
import { useLocationsContext } from '@/contexts/Locations.context';

export default function AlertSectionReferences() {

	//
	// A. Setup variables
	const { data } = useLocationsContext();

	const municipalitiesOptions = useMemo(() => {
		if (!data.municipalities) return [];
	
			return data.municipalities.map(municipality => ({
				label: municipality.name,	
				value: municipality.id,
			}));
	}, [data.municipalities]);

	//
	// B. Render components

	return (
		<Section title="Referências" description="As referências (Linhas, Paragens, Municípios, Etc...) afetadas deste alerta.">
			<Surface padding="sm" gap="md">
				<Combobox label="Municípios Afetados" description='Selecione os munícios que serão afetados pelo alerta' data={municipalitiesOptions} searchable multiple clearable fullWidth/>
				<SegmentedControl data={[{label: 'Selecionar Linhas', value: 'lines'}, {label: 'Selecionar Paragens', value: 'stops'}, {label: 'Selecionar Agências', value: 'agencies'}]} fullWidth/>
				<div className={styles.referenceCardContainer}>
					<ReferenceCard />
					<ReferenceCard />
				</div>
			</Surface>
		</Section>
	);
}
