'use client';

import { Combobox, Section, Surface } from '@tmlmobilidade/ui';
import { causeSchema, effectSchema } from '@tmlmobilidade/core-types';
import { useAlertDetailContext } from '@/contexts/AlertDetail.context';

import styles from './styles.module.css';

export default function AlertSectionCauseEffect() {

	const { data: alertDetailData } = useAlertDetailContext();

	return (
		<Section title="Causa e Efeito" description="A causa é o que aconteceu, o efeito é o que aconteceu como consequência.">
		<Surface flexDirection="row" alignItems="center" padding="sm" gap="md">
			<div className={styles.container}>
				<Combobox label="Causa" description="O que aconteceu" data={causeSchema.options} searchable {...alertDetailData.form.getInputProps('cause')} />
			</div>
			<div className={styles.container}>
				<Combobox label="Efeito" description="O que aconteceu como consequência" data={effectSchema.options} searchable {...alertDetailData.form.getInputProps('effect')}/>
			</div>
		</Surface>
	</Section>
	);
}
