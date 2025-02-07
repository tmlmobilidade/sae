import { Routes } from '@/lib/routes';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Sidebar } from '@tmlmobilidade/ui';

import styles from './styles.module.css';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
	const items = [
		{
			href: Routes.ALERT_LIST,
			icon: <IconAlertTriangle />,
			label: 'Alerts',
		},
	];
	return (
		<div className={styles.container}>
			<Sidebar items={items} />
			<div className={styles.children}>
				{children}
			</div>
		</div>
	);
}
