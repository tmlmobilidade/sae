import { Section, Surface } from '@tmlmobilidade/ui';

export default function AlertSectionValidity() {
	return (
		<Section title="Período de Vigência" description="Período em que o alerta é válido. Distinto da visibilidade. O alerta pode estar visível mas não ser ainda válido (ex: um alerta para um corte de estrada é vísível uma semana antes, mas o corte em si é apenas durante 2 dias).">
		<Surface padding="sm" gap="md">
			something
		</Surface>
	</Section>
	);
}
