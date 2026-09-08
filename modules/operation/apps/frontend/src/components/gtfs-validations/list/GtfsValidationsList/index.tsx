'use client';

import { ValidationsListFiltersBar } from '@/components/gtfs-validations/list/filters/ValidationsListFiltersBar';
import { ValidationsListCellDate } from '@/components/gtfs-validations/list/ValidationsListCellCreatedAt';
import { ValidationsListHeader } from '@/components/gtfs-validations/list/ValidationsListHeader';
import { useGtfsValidationsAgenciesData } from '@/components/gtfs-validations/shared/use-gtfs-validations-agencies-data';
import { PAGE_ROUTES } from '@tmlmobilidade/consts';
import { type ValidationListItem } from '@tmlmobilidade/go-operation-pckg-types';
import { AgencyTag, DataTable, type DataTableColumn, ErrorDisplay, IdTag, Pane, ProcessingStatusDisplay, ValidityStatusDisplay } from '@tmlmobilidade/ui';
import { keepUrlParams } from '@tmlmobilidade/ui';
import { useParams, useRouter } from 'next/navigation';

import { useValidationsListData } from '../use-validations-list-data';

/* * */

export function GtfsValidationsList() {
	//

	//
	// A. Setup variables

	const router = useRouter();
	const params = useParams<{ id?: string }>();

	const { data: agenciesData } = useGtfsValidationsAgenciesData({
		permissions: { actions: ['read'], scope: 'gtfs_validations' },
	});

	const validationsData = useValidationsListData();

	const columns: DataTableColumn<ValidationListItem>[] = [
		{
			accessor: '_id',
			render: item => <IdTag id={item._id} />,
			title: '#ID',
			width: 90,
		},
		{
			accessor: 'agency_id_normalized',
			render: item => (
				<AgencyTag
					agencyId={item.agency_id}
					copyOnClick={false}
					data={agenciesData}
					showShortName
				/>
			),
			title: 'Operador',
			width: 180,
		},
		{
			accessor: 'processing_status',
			render: item => <ProcessingStatusDisplay value={item.processing_status} />,
			title: 'Estado',
			width: 135,
		},
		{
			accessor: 'validity_status',
			render: item => <ValidityStatusDisplay value={item.validity_status} />,
			title: 'Resultado',
			width: 110,
		},
		{
			accessor: 'created_at',
			render: item => <ValidationsListCellDate value={item.created_at} />,
			title: 'Data de Submissão',
			width: 300,
		},
	];

	//
	// B. Handle actions

	const handleRowClick = (item: ValidationListItem) => {
		router.push(keepUrlParams(PAGE_ROUTES.operation.GTFS_VALIDATIONS_DETAIL(item._id)));
	};

	//
	// C. Render components

	return (
		<Pane header={[
			<ValidationsListHeader key="header" />,
			<ValidationsListFiltersBar key="filters" />,
		]}
		>
			{validationsData.error && <ErrorDisplay message={validationsData.error} />}
			<DataTable
				columns={columns}
				isLoading={validationsData.isLoading}
				onRowClick={handleRowClick}
				records={validationsData.data}
				rowIdAccessor="_id"
				selectedId={params.id}
			/>
		</Pane>
	);
}
