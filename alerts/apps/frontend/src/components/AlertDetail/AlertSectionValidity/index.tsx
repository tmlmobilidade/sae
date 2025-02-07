'use client';

import { useAlertDetailContext } from '@/contexts/AlertDetail.context';
import { DateTimePicker, Section, Surface } from '@tmlmobilidade/ui';

import styles from './styles.module.css';

export default function AlertSectionValidity() {
	const { data: alertDetailData } = useAlertDetailContext();

	const startDate = new Date(alertDetailData.form.getValues().active_period_start_date);
	const endDate = new Date(alertDetailData.form.getValues().active_period_end_date);

	return (
		<Section
			description="Período em que o alerta é válido. Distinto da visibilidade. O alerta pode estar visível mas não ser ainda válido (ex: um alerta para um corte de estrada é vísível uma semana antes, mas o corte em si é apenas durante 2 dias)."
			title="Período de Vigência"
		>
			<Surface flexDirection="row" gap="md" padding="sm">
				<DateTimePicker
					className={styles.datePicker}
					description="Data de início do alerta"
					label="Data de Início"
					{...alertDetailData.form.getInputProps('active_period_start_date')}
					value={startDate}
				/>
				<DateTimePicker
					className={styles.datePicker}
					description="Data de fim do alerta"
					label="Data de Fim"
					{...alertDetailData.form.getInputProps('active_period_end_date')}
					value={endDate}
				/>
			</Surface>
		</Section>
	);
}
