'use client';

import { useAlertDetailContext } from '@/contexts/AlertDetail.context';
import { DateTimePicker, Section, Surface } from '@tmlmobilidade/ui';

import styles from './styles.module.css';

export default function AlertSectionVisibility() {
	const { data: alertDetailData } = useAlertDetailContext();

	const startDate = new Date(alertDetailData.form.getValues().publish_start_date);
	const endDate = new Date(alertDetailData.form.getValues().publish_end_date);

	return (
		<Section
			description="É possível agendar a permanência do alerta nos canais digitais. A visibilidade do alerta é diferente do seu período de vigência."
			title="Visibilidade e Agendamento"
		>
			<Surface flexDirection="row" gap="md" padding="sm">
				<DateTimePicker
					className={styles.datePicker}
					description="Data de início do alerta"
					label="Data de Início"
					{...alertDetailData.form.getInputProps('publish_start_date')}
					value={startDate}
				/>
				<DateTimePicker
					className={styles.datePicker}
					description="Data de fim do alerta"
					label="Data de Fim"
					{...alertDetailData.form.getInputProps('publish_end_date')}
					value={endDate}
				/>
			</Surface>
		</Section>
	);
}
