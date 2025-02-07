'use client';

import { useAlertDetailContext } from '@/contexts/AlertDetail.context';
import { causeSchema, effectSchema } from '@tmlmobilidade/core-types';
import { Combobox, Section, Surface } from '@tmlmobilidade/ui';

import styles from './styles.module.css';

export default function AlertSectionCauseEffect() {
	const { data: alertDetailData } = useAlertDetailContext();

	return (
		<Section description="A causa é o que aconteceu, o efeito é o que aconteceu como consequência." title="Causa e Efeito">
			<Surface alignItems="center" flexDirection="row" gap="md" padding="sm">
				<div className={styles.container}>
					<Combobox data={causeSchema.options} description="O que aconteceu" label="Causa" searchable {...alertDetailData.form.getInputProps('cause')} />
				</div>
				<div className={styles.container}>
					<Combobox data={effectSchema.options} description="O que aconteceu como consequência" label="Efeito" searchable {...alertDetailData.form.getInputProps('effect')} />
				</div>
			</Surface>
		</Section>
	);
}
