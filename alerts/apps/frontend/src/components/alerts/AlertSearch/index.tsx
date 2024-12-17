'use client';

/* * */

import CreateButton from '@/components/common/CreateButton';
import Input from '@/components/common/Input';
import { useAlertsListContext } from '@/context/AlertList.context';

import styles from './styles.module.css';

/* * */

export default function AlertSearch() {
	const { actions, filters } = useAlertsListContext();

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		actions.updateFilterBySearchQuery(e.target.value);
	};

	const handleCreateClick = () => {
		actions.addAlert();
	};

	return (
		<div className={styles.container}>
			<Input
				className={styles.input}
				onChange={handleSearchChange}
				placeholder="Pesquisar..."
				value={filters.search_query || ''}
			/>
			<CreateButton onClick={handleCreateClick} />
		</div>
	);
}
