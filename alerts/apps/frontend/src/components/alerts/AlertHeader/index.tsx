'use client';

import { Surface } from '@/components/layout/Surface';
import { useAlertsListStore } from '@/store/alerts-list.store';

export default function AlertHeader() {
	const { alert } = useAlertsListStore();
	return <Surface padding="md">{alert?.name}</Surface>;
}
