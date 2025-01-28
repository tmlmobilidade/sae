import { Combobox, Section, SegmentedControl, Surface } from '@tmlmobilidade/ui';
import styles from './styles.module.css';
import ReferenceCard from '../ReferenceCard';

export default function AlertSectionReferences() {

	const municipalities = [
		"Alcochete",
		"Almada",
		"Barreiro",
		"Amadora",
		"Cascais",
		"Lisboa",
		"Loures",
		"Mafra",
		"Moita",
		"Montijo",
		"Odivelas",
		"Oeiras",
		"Palmela",
		"Seixal",
		"Sintra",
		"Sesimbra",
		"Setúbal e Vila Franca de Xira"
	]

	return (
		<Section title="Referências" description="As referências (Linhas, Paragens, Municípios, Etc...) afetadas deste alerta.">
			<Surface padding="sm" gap="md">
				<Combobox label="Municípios Afetados" description='Selecione os munícios que serão afetados pelo alerta' data={municipalities} searchable multiple fullWidth/>
				<SegmentedControl data={[{label: 'Selecionar Linhas', value: 'lines'}, {label: 'Selecionar Paragens', value: 'stops'}, {label: 'Selecionar Agências', value: 'agencies'}]} fullWidth/>
				<div className={styles.referenceCardContainer}>
					<ReferenceCard />
					<ReferenceCard />
				</div>
			</Surface>
		</Section>
	);
}
