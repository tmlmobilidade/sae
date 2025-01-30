'use client';

import { DateTimePicker, Section, Surface } from '@tmlmobilidade/ui';
import styles from './styles.module.css';
import { useAlertDetailContext } from '@/contexts/AlertDetail.context';

export default function AlertSectionVisibility() {
	const { data: alertDetailData } = useAlertDetailContext();

	return (
		<Section
			title="Visibilidade e Agendamento"
			description="É possível agendar a permanência do alerta nos canais digitais. A visibilidade do alerta é diferente do seu período de vigência."
		>
			<Surface flexDirection="row" padding="sm" gap="md">
				<DateTimePicker
					className={styles.datePicker}
					label="Data de Início"
					description="Data de início do alerta"
					{...alertDetailData.form.getInputProps('publish_start_date')}
				/>
				<DateTimePicker
					className={styles.datePicker}
					label="Data de Fim"
					description="Data de fim do alerta"
					{...alertDetailData.form.getInputProps('publish_end_date')}
				/>
			</Surface>
		</Section>
	);
}
