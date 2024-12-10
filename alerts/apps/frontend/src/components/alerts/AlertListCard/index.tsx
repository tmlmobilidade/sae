'use client';

import { useAlertsListContext } from '@/components/context/AlertList.context';
import { IconChevronRight } from '@tabler/icons-react';
import { Alert } from '@tmlmobilidade/services/types';

import styles from './styles.module.css';

/* * */

interface Props {
	alert: Alert
	onSelect?: (selected: Alert) => void
	selected?: boolean
}

export default function AlertListCard({ alert, onSelect, selected = false }: Props) {
	const setSelected = useAlertsListContext().actions.setSelected;

	const handleClick = () => {
		setSelected(alert);
		onSelect?.(alert);
	};

	return (
		<div aria-selected={selected} className={styles.content} onClick={handleClick}>
			<div className={styles.title}>{alert.title}</div>
			<IconChevronRight className={styles.icon} />
		</div>
	);
}
