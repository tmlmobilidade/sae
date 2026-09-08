'use client';

import { PAGE_ROUTES } from '@tmlmobilidade/consts';
import { type ValidationListItem } from '@tmlmobilidade/go-operation-pckg-types';
import { AgencyTag, DataTable, type DataTableColumn, displayUnixMilliseconds, ErrorDisplay, IdTag, Pane, ProcessingStatusDisplay, ValidityStatusDisplay } from '@tmlmobilidade/ui';
import { keepUrlParams } from '@tmlmobilidade/ui';
import { useRouter } from 'next/navigation';

import { useGtfsValidationsAgenciesData } from '../..//shared/use-gtfs-validations-agencies-data';
import { useGtfsValidationsDetailGtfsValidationId } from '../../detail/use-gtfs-validations-detail-gtfs-validation-id';
import { ValidationsListFiltersBar } from '../filters/ValidationsListFiltersBar';
import { GtfsValidationsListHeader } from '../GtfsValidationsListHeader';
import { useValidationsListData } from '../use-validations-list-data';

/* * */

export function GtfsValidationsList() {
	//

	//
	// A. Setup variables

	const router = useRouter();

	const { gtfsValidationId } = useGtfsValidationsDetailGtfsValidationId();

	const validationsListData = useValidationsListData();

	const { data: agenciesData } = useGtfsValidationsAgenciesData({
		permissions: { actions: ['read'], scope: 'gtfs_validations' },
	});

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
			render: item => displayUnixMilliseconds(item.created_at),
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
			<GtfsValidationsListHeader key="header" />,
			<ValidationsListFiltersBar key="filters" />,
		]}
		>
			{validationsListData.error && <ErrorDisplay message={validationsListData.error} />}
			<DataTable
				columns={columns}
				isLoading={validationsListData.isLoading}
				onRowClick={handleRowClick}
				records={validationsListData.data}
				rowIdAccessor="_id"
				selectedId={gtfsValidationId}
			/>
		</Pane>
	);
}
