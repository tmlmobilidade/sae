import { useAlertListContext } from '@/contexts/AlertList.context';
import { Routes } from '@/lib/routes';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { Button, SegmentedControl, Surface, TextInput } from '@tmlmobilidade/ui';
import Link from 'next/link';

import styles from './styles.module.css';

export default function Header() {
	const { actions: { changeSearchQuery }, filters: { searchQuery } } = useAlertListContext();

	return (
		<Surface
			alignItems="center"
			classNames={styles}
			flexDirection="row"
			justifyContent="space-between"
			padding="sm"
		>
			<span className={styles.title}>
				Alertas
			</span>
			<div className={styles.actions}>
				<TextInput
					leftSection={<IconSearch size={20} />}
					miw={400}
					onChange={e => changeSearchQuery(e.target.value)}
					placeholder="Pesquisar alerta"
					value={searchQuery}
				/>
				<Link href={Routes.ALERT_DETAIL('new')}>
					<Button label="Novo alerta" leftSection={<IconPlus size={20} />} />
				</Link>

				<SegmentedControl data={['Planeados', 'Tempo Real']} size="md" />
			</div>
		</Surface>
	);
}
