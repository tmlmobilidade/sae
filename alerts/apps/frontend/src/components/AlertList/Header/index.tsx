import { Button, SegmentedControl, Surface, TextInput } from '@tmlmobilidade/ui';
import styles from './styles.module.css';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useAlertListContext } from '@/contexts/AlertList.context';
import Link from 'next/link';
import { Routes } from '@/lib/routes';

export default function Header() {
	const { filters: { searchQuery }, actions: { changeSearchQuery } } = useAlertListContext();

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
					value={searchQuery}
					onChange={(e) => changeSearchQuery(e.target.value)}
					leftSection={<IconSearch size={20} />}
                />
				<Link href={Routes.ALERT_DETAIL('new')}>
					<Button>
						<IconPlus size={20} />
						<span>Novo alerta</span>
					</Button>
				</Link>

                <SegmentedControl size='md' data={['Planeados', 'Tempo Real']} />
			</div>
		</Surface>
	);
}
