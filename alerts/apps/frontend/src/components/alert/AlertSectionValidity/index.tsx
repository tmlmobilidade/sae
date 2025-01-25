import { DateTimePicker, Section, Surface } from '@tmlmobilidade/ui';
import styles from './styles.module.css';

export default function AlertSectionValidity() {
	return (
		<Section title="Período de Vigência" description="Período em que o alerta é válido. Distinto da visibilidade. O alerta pode estar visível mas não ser ainda válido (ex: um alerta para um corte de estrada é vísível uma semana antes, mas o corte em si é apenas durante 2 dias).">
		<Surface flexDirection="row" padding="sm" gap="md">
			<DateTimePicker className={styles.datePicker} label="Data de Início" description="Data de início do alerta" />
			<DateTimePicker className={styles.datePicker} label="Data de Fim" description="Data de fim do alerta" />
		</Surface>
	</Section>
	);
}
