import { useAlertDetailContext } from '@/components/context/AlertDetail.context';
import { Grid } from '@/components/layout/Grid';
import { Surface } from '@/components/layout/Surface';
import { Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';

import styles from './styles.module.css';

export default function AlertActiveSchedule() {
	const alertDetailContext = useAlertDetailContext();

	return (
		<Surface className={styles.surface} padding="lg">
			<Title order={2}>Período de Vigência</Title>
			<Grid columns="ab" withGap>
				<DateTimePicker
					clearable
					description="Data de início da publicação"
					dropdownType="modal"
					label="Data de início da publicação"
					{...alertDetailContext.data.form.getInputProps('active_period_start_date')}
					placeholder="Selecione uma data e hora"
					readOnly={alertDetailContext.flags.isReadOnly}
					value={alertDetailContext.data.form.values.active_period_start_date ? new Date(alertDetailContext.data.form.values.active_period_start_date) : null}
				/>
				<DateTimePicker
					clearable
					description="Data de fim da publicação"
					disabled={!alertDetailContext.data.form.values.active_period_start_date}
					dropdownType="modal"
					label="Data de fim da publicação"
					{...alertDetailContext.data.form.getInputProps('active_period_end_date')}
					placeholder="Selecione uma data e hora"
					readOnly={alertDetailContext.flags.isReadOnly}
					value={alertDetailContext.data.form.values.active_period_end_date ? new Date(alertDetailContext.data.form.values.active_period_end_date) : null}
				/>
			</Grid>
		</Surface>
	);
}
