'use client';

import { useAlertsListStore } from '@/store/alerts-list.store';
import { IconChevronRight } from '@tabler/icons-react';
import { Alert } from '@tmlmobilidade/services/types';

import styles from './styles.module.css';

/* * */

interface Props {
	alert: Alert
	selected?: boolean
}

export default function AlertListCard({ alert, selected = false }: Props) {
	const setSelected = useAlertsListStore(state => state.actions.setSelected);

	const handleClick = () => {
		setSelected(alert);
	};

	return (
		<div aria-selected={selected} className={styles.content} onClick={handleClick}>
			<div className={styles.title}>{alert.title}</div>
			<IconChevronRight className={styles.icon} />
		</div>
	);
}
