import Input from '@/components/common/Input';
import { useAlertDetailContext } from '@/components/context/AlertDetail.context';
import { Surface } from '@/components/layout/Surface';
import { Title } from '@mantine/core';

import styles from './styles.module.css';

export default function AlertInfo() {
	const { form } = useAlertDetailContext();
	return (
		<Surface className={styles.surface} padding="md">
			<Title order={2}>Titulo e Descrição</Title>
			<Input
				description="É importante que o título seja curto e claro, para que não apareça cortado no site, apps, etc."
				label="Titulo Curto"
				placeholder="..."
				{...form.getInputProps('title')}
			/>
			<Input
				description="Um bom alerta explica a situação de forma breve e clara, explicita as suas causas e como está a ser mitigado, e apresenta uma ou mais soluções de como o cliente poderá ultrapassar esta situação."
				label="Descrição"
				placeholder="..."
				{...form.getInputProps('description')}
			/>
			<Input
				description="Opcionalmente inclua o URL de um website onde é possível obter mais informação."
				label="URL"
				placeholder="..."
				{...form.getInputProps('image_url')}
			/>
		</Surface>
	);
}
