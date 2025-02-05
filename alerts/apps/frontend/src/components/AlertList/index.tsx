'use client';

import { useAlertListContext } from '@/contexts/AlertList.context';
import { Alert } from '@tmlmobilidade/core-types';
import { Badge, DataTable, DataTableColumn } from '@tmlmobilidade/ui';

import StopCell from './StopCell';
import LineCell from './LineCell';
import MunicipalityCell from './MunicipalityCell';
import Filters from './Filters';
import { getAvailableLines, getAvailableStops } from '@/lib/alert-utils';
import Header from './Header';
import { useRouter } from 'next/navigation';
import { Routes } from '@/lib/routes';

export default function AlertList() {
	//

	//
	// A. Setup Variables
	const router = useRouter();
	const { data, flags } = useAlertListContext();

	const columns: DataTableColumn<Alert>[] = [
		{
			accessor: 'state',
			title: 'Estado',
			render: ({ publish_status }) => <Badge>{publish_status}</Badge>,
		},
		{ accessor: 'title', title: 'Título' },
		{
			accessor: 'municipality',
			title: 'Municípios',
			render: ({ municipality_ids }) => (
				<MunicipalityCell municipality_ids={municipality_ids} />
			),
		},
		{
			accessor: 'lines',
			title: 'Linhas',
			render: (alert) => {
				return <LineCell line_ids={getAvailableLines(alert)} />
			},
		},
		{
			accessor: 'stops',
			title: 'Paragens',
			render: (alert) => {
				return <StopCell stop_ids={getAvailableStops(alert)} />
			},
		},
	];

	// 
	// B. Render
	if (flags.isLoading) {
		return <div>Loading...</div>;
	} else if (flags.error) {
		return <div>Error: {flags.error.message}</div>;
	}

	return (
		<div>
			<Header />
			<Filters />
			<DataTable
				onRowClick={(alert) => {
					router.push(Routes.ALERT_DETAIL(alert._id));
				}}
				maxHeight={500}
				records={data.filtered}
				columns={columns}
			/>
		</div>
	);
}



