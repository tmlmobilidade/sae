'use client';

/* * */

import Input from '@/components/common/Input';
import { useAlertsListStore } from '@/store/alerts-list.store';
import { IconCirclePlus } from '@tabler/icons-react';
import { useQueryState } from 'nuqs';
import { useEffect } from 'react';

import styles from './styles.module.css';

/* * */

export default function AlertSearch() {
	const [search, setSearch] = useQueryState('search');
	const filters = useAlertsListStore(state => state.filters);
	const updateFilterBySearchQuery = useAlertsListStore(state => state.actions.updateFilterBySearchQuery);

	useEffect(() => {
		if (search) {
			updateFilterBySearchQuery(search);
		}
	}, [search]);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value || null);
		updateFilterBySearchQuery(e.target.value);
	};

	return (
		<div className={styles.container}>
			<Input
				className={styles.input}
				onChange={handleSearchChange}
				placeholder="Pesquisar..."
				value={filters.search || ''}
			/>
			<div className={styles.button}>
				<IconCirclePlus />
			</div>
		</div>
	);
}
