'use client';

import { useAlertListContext } from '@/contexts/AlertList.context';
import { getAvailableLines, getAvailableStops } from '@/lib/alert-utils';
import { Routes } from '@/lib/routes';
import { Alert } from '@tmlmobilidade/core-types';
import { Badge, DataTable, DataTableColumn } from '@tmlmobilidade/ui';
import { useRouter } from 'next/navigation';

import Filters from './Filters';
import Header from './Header';
import LineCell from './LineCell';
import MunicipalityCell from './MunicipalityCell';
import StopCell from './StopCell';
import styles from './styles.module.css';

export default function AlertList() {
	//

	//
	// A. Setup Variables
	const router = useRouter();
	const { data, flags } = useAlertListContext();

	const columns: DataTableColumn<Alert>[] = [
		{
			accessor: 'state',
			render: ({ publish_status }) => <Badge>{publish_status}</Badge>,
			title: 'Estado',
		},
		{ accessor: 'title', title: 'Título', width: 400 },
		{
			accessor: 'municipality',
			render: ({ municipality_ids }) => (
				<MunicipalityCell municipality_ids={municipality_ids} />
			),
			title: 'Municípios',
		},
		{
			accessor: 'lines',
			render: (alert) => {
				return <LineCell line_ids={getAvailableLines(alert)} />;
			},
			title: 'Linhas',
		},
		{
			accessor: 'stops',
			render: (alert) => {
				return <StopCell stop_ids={getAvailableStops(alert)} />;
			},
			title: 'Paragens',
		},
	];

	//
	// B. Render
	if (flags.isLoading) {
		return <div>Loading...</div>;
	}
	else if (flags.error) {
		return <div>Error: {flags.error.message}</div>;
	}

	return (
		<div className={styles.container}>
			<Header />
			<Filters />
			<DataTable
				classnames={{ root: styles.table, row: styles.row }}
				columns={columns}
				records={data.filtered}
				onRowClick={(alert) => {
					router.push(Routes.ALERT_DETAIL(alert._id));
				}}
			/>
		</div>
	);
}
