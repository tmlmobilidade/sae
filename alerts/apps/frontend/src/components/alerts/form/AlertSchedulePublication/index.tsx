import { useAlertDetailContext } from '@/components/context/AlertDetail.context';
import { Grid } from '@/components/layout/Grid';
import { Surface } from '@/components/layout/Surface';
import { Select, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { publishStatusSchema } from '@tmlmobilidade/services/types';

import styles from './styles.module.css';

export default function AlertPublicationSchedule() {
	const alertDetailContext = useAlertDetailContext();

	return (
		<Surface className={styles.surface} padding="lg">
			<Title order={2}>Publicação e Agendamento</Title>

			<Select
				description="Status do alerta"
				label="Status"
				nothingFoundMessage="Nenhum status encontrado"
				placeholder="Selecione um status"
				{...alertDetailContext.data.form.getInputProps('publish_status')}
				data={Object.values(publishStatusSchema.Values)}
				readOnly={alertDetailContext.flags.isReadOnly}
				searchable
			/>

			<Grid columns="ab" withGap>
				<DateTimePicker
					clearable
					description="Data de início da publicação"
					dropdownType="modal"
					label="Data de início da publicação"
					{...alertDetailContext.data.form.getInputProps('publish_start_date')}
					placeholder="Selecione uma data e hora"
					readOnly={alertDetailContext.flags.isReadOnly}
					value={alertDetailContext.data.form.values.publish_start_date ? new Date(alertDetailContext.data.form.values.publish_start_date) : null}
				/>
				<DateTimePicker
					clearable
					description="Data de fim da publicação"
					disabled={!alertDetailContext.data.form.values.publish_start_date}
					dropdownType="modal"
					label="Data de fim da publicação"
					placeholder="Selecione uma data e hora"
					readOnly={alertDetailContext.flags.isReadOnly}
					{...alertDetailContext.data.form.getInputProps('publish_end_date')}
					value={alertDetailContext.data.form.values.publish_end_date ? new Date(alertDetailContext.data.form.values.publish_end_date) : null}
				/>
			</Grid>

		</Surface>
	);
}
