import { Section, Surface, TextArea, TextInput } from '@tmlmobilidade/ui';

export default function AlertSectionVisibility() {
	return (
		<Section
			title="Título e Descrição"
			description="Breve descrição do que motivou a criação do alerta"
		>
			<Surface padding="sm" gap="md">
				<TextInput
					placeholder="..."
					description="É importante que o título seja curto e claro, para que não apareça cortado no site, apps, etc."
					label="Título Curto"
				/>
				<TextArea
					placeholder="..."
					description="Um bom alerta explica a situação de forma breve e clara, explicita as suas causas e como está a ser mitigado, e apresenta uma ou mais soluções de como o passageiro poderá ultrapassar esta situação."
					label="Descrição"
				/>
				<TextInput
					placeholder="https://www.cm-setubal.com/..."
					description="Opcionalmente inclua o URL de um website onde é possivel obter mais informação"
					label="Link Adicional"
				/>
			</Surface>
		</Section>
	);
}
