import { useAlertDetailContext } from '@/components/context/AlertDetail.context';
import { Grid } from '@/components/layout/Grid';
import { Surface } from '@/components/layout/Surface';
import { Select, Title } from '@mantine/core';
import { causeSchema, effectSchema } from '@tmlmobilidade/services/types';

import styles from './styles.module.css';

export default function AlertCauseEffect() {
	const alertDetailContext = useAlertDetailContext();

	return (
		<Surface className={styles.surface} padding="lg">
			<Title order={2}>Causa e Efeito</Title>

			<Grid columns="ab" withGap>
				<Select
					description="Indique qual o tipo de situação que motivou este alerta."
					label="Causa"
					placeholder="Selecione uma causa"
					{...alertDetailContext.data.form.getInputProps('cause')}
					data={Object.values(causeSchema.Values)}
					readOnly={alertDetailContext.flags.isReadOnly}
					searchable
				/>
				<Select
					description="Indique qual a consequência na operação."
					label="Efeito"
					placeholder="Selecione um efeito"
					{...alertDetailContext.data.form.getInputProps('effect')}
					data={Object.values(effectSchema.Values)}
					readOnly={alertDetailContext.flags.isReadOnly}
					searchable
				/>
			</Grid>
		</Surface>
	);
}
