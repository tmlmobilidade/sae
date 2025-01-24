import { Combobox, Section, Surface } from '@tmlmobilidade/ui';
import { causeSchema, effectSchema } from '@tmlmobilidade/core-types';

import styles from './styles.module.css';

export default function AlertSectionCauseEffect() {


	return (
		<Section title="Causa e Efeito" description="A causa é o que aconteceu, o efeito é o que aconteceu como consequência.">
		<Surface flexDirection="row" alignItems="center" padding="sm" gap="md">
			<div className={styles.container}>
				<Combobox label="Causa" description="O que aconteceu" data={causeSchema.options} searchable/>
			</div>
			<div className={styles.container}>
				<Combobox label="Efeito" description="O que aconteceu como consequência" data={effectSchema.options} searchable/>
			</div>
		</Surface>
	</Section>
	);
}
