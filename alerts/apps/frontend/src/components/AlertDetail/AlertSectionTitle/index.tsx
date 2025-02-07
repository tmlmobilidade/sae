'use client';

import { IconLink } from '@tabler/icons-react';
import { Section, Surface, TextArea, TextInput } from '@tmlmobilidade/ui';
import { useAlertDetailContext } from '@/contexts/AlertDetail.context';
import AlertImage from '../AlertImage';

export default function AlertSectionTitle() {
	const { data: alertDetailData } = useAlertDetailContext();

	return (
		<Section
			title="Título e Descrição"
			description="Breve descrição do que motivou a criação do alerta"
		>
			<Surface padding="sm" gap="md">
				<TextInput
					withAsterisk
					placeholder="..."
					description="É importante que o título seja curto e claro, para que não apareça cortado no site, apps, etc."
					label="Título Curto"
					maxLength={255}
					{...alertDetailData.form.getInputProps('title')}
				/>
				<TextArea
					withAsterisk
					placeholder="..."
					description="Um bom alerta explica a situação de forma breve e clara, explicita as suas causas e como está a ser mitigado, e apresenta uma ou mais soluções de como o passageiro poderá ultrapassar esta situação."
					label="Descrição"
					{...alertDetailData.form.getInputProps('description')}
				/>
				<AlertImage />
				<TextInput
					leftSection={<IconLink size={18} />}
					placeholder="https://www.cm-setubal.com/..."
					description="Opcionalmente inclua o URL de um website onde é possivel obter mais informação"
					label="Link Adicional"
					{...alertDetailData.form.getInputProps('link')}
				/>
			</Surface>
		</Section>
	);
}
