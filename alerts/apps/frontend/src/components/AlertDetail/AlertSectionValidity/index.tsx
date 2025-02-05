'use client';

import { DateTimePicker, Section, Surface } from '@tmlmobilidade/ui';
import styles from './styles.module.css';
import { useAlertDetailContext } from '@/contexts/AlertDetail.context';

export default function AlertSectionValidity() {
	const { data: alertDetailData } = useAlertDetailContext();

	const startDate = new Date(alertDetailData.form.getValues().active_period_start_date);
	const endDate = new Date(alertDetailData.form.getValues().active_period_end_date);

	return (
		<Section
			title="Período de Vigência"
			description="Período em que o alerta é válido. Distinto da visibilidade. O alerta pode estar visível mas não ser ainda válido (ex: um alerta para um corte de estrada é vísível uma semana antes, mas o corte em si é apenas durante 2 dias)."
		>
			<Surface flexDirection="row" padding="sm" gap="md">
				<DateTimePicker
					className={styles.datePicker}
					label="Data de Início"
					description="Data de início do alerta"
					{...alertDetailData.form.getInputProps('active_period_start_date')}
					value={startDate}
				/>
				<DateTimePicker
					className={styles.datePicker}
					label="Data de Fim"
					description="Data de fim do alerta"
					{...alertDetailData.form.getInputProps('active_period_end_date')}
					value={endDate}
				/>
			</Surface>
		</Section>
	);
}
