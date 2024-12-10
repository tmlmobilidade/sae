'use client';

/* * */

import Input from '@/components/common/Input';
import { useAlertsListContext } from '@/components/context/AlertList.context';
import { IconCirclePlus } from '@tabler/icons-react';

import styles from './styles.module.css';

/* * */

export default function AlertSearch() {
	const setFilterBySearchQuery = useAlertsListContext().actions.updateFilterBySearchQuery;
	const searchQuery = useAlertsListContext().filters.search_query;

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFilterBySearchQuery(e.target.value);
	};

	return (
		<div className={styles.container}>
			<Input
				className={styles.input}
				onChange={handleSearchChange}
				placeholder="Pesquisar..."
				value={searchQuery || ''}
			/>
			<div className={styles.button}>
				<IconCirclePlus />
			</div>
		</div>
	);
}
