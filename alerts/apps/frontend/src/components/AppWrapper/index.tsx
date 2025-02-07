import { Sidebar } from "@tmlmobilidade/ui";
import { IconAlertTriangle } from "@tabler/icons-react";
import { Routes } from "@/lib/routes";

import styles from './styles.module.css';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
    const items = [
        {
            label: 'Alerts',
            href: Routes.ALERT_LIST,
            icon: <IconAlertTriangle />,
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