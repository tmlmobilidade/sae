import { Button, SegmentedControl, Surface, Text, TextInput } from '@tmlmobilidade/ui';
import styles from './styles.module.css';
import { IconPlus, IconSearch } from '@tabler/icons-react';

export default function Header() {
	return (
		<Surface
			padding="sm"
			classNames={styles}
			flexDirection="row"
			alignItems="center"
			justifyContent="space-between"
		>
			<span className={styles.title}>
				Alertas
			</span>
			<div className={styles.actions}>
				<TextInput
					miw={400}
					placeholder="Pesquisar alerta"
					leftSection={<IconSearch size={20} />}
                />
				<Button>
					<IconPlus size={20} />
					<span>Novo alerta</span>
				</Button>

                <SegmentedControl size='md' data={['Planeados', 'Tempo Real']} />
			</div>
		</Surface>
	);
}
