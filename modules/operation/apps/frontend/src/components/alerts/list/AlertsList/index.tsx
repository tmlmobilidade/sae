'use client';

import { PAGE_ROUTES } from '@tmlmobilidade/consts';
import { type AlertsListItem } from '@tmlmobilidade/go-operation-pckg-types';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { AgencyTag, DataTable, type DataTableColumn, ErrorDisplay, keepUrlParams, Pane, PublishStatusDisplay, UnixMillisecondsDisplay } from '@tmlmobilidade/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { useAlertsDetailAlertId } from '../../detail/use-alerts-detail-alert-id';
import { AlertsListHeader } from '../../list/AlertsListHeader';
import { AlertsListFiltersBar } from '../../list/filters/AlertsListFiltersBar';
import { AlertsListCellCauseEffect } from '../../list/table/AlertsListCellCauseEffect';
import { AlertsListCellReferenceType } from '../../list/table/AlertsListCellReferenceType';
import { useAlertsAgenciesData } from '../../shared/use-alerts-agencies-data';
import { useAlertsListData } from '../use-alerts-list-data';

/* * */

export function AlertsList() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const router = useRouter();

	const { alertId } = useAlertsDetailAlertId();

	const alertsListData = useAlertsListData();

	const { data: agenciesData } = useAlertsAgenciesData({
		permissions: {
			actions: [PermissionCatalog.all.alerts.actions.read],
			scope: PermissionCatalog.all.alerts.scope,
		},
	});

	const columns: DataTableColumn<AlertsListItem>[] = [
		{
			accessor: 'agency_id',
			render: item => (
				<AgencyTag
					agencyId={item.agency_id}
					copyOnClick={false}
					data={agenciesData}
					showShortName
				/>
			),
			title: t('alerts:list.AlertsList.columns.agency_id.label'),
			width: 180,
		},
		{
			accessor: 'publish_status',
			render: item => <PublishStatusDisplay value={item.publish_status} />,
			title: t('alerts:list.AlertsList.columns.publish_status.label'),
			width: 125,
		},
		{
			accessor: 'reference_type',
			render: item => <AlertsListCellReferenceType value={item.reference_type} />,
			title: t('alerts:list.AlertsList.columns.reference_type.label'),
			width: 150,
		},
		{
			accessor: 'title',
			title: t('alerts:list.AlertsList.columns.title.label'),
			width: 500,
		},
		{
			accessor: 'created_at',
			render: item => <UnixMillisecondsDisplay value={item.created_at} showDate />,
			title: t('alerts:list.AlertsList.columns.created_at.label'),
			width: 225,
		},
		{
			accessor: 'publish_start_date',
			render: item => <UnixMillisecondsDisplay value={item.publish_start_date} showDate />,
			title: t('alerts:list.AlertsList.columns.publish_date.label'),
			width: 225,
		},
		{
			accessor: 'cause',
			render: item => <AlertsListCellCauseEffect cause={item.cause} effect={item.effect} />,
			title: t('alerts:list.AlertsList.columns.cause_effect.label'),
			width: 500,
		},
	];

	//
	// B. Handle actions

	const handleRowClick = (item: AlertsListItem) => {
		router.push(keepUrlParams(PAGE_ROUTES.operation.ALERTS_DETAIL(item._id)));
	};

	//
	// C. Render components

	return (
		<Pane
			header={[
				<AlertsListHeader key="header" />,
				<AlertsListFiltersBar key="filters" />,
			]}
		>
			{alertsListData.error && <ErrorDisplay message={alertsListData.error} />}
			<DataTable
				columns={columns}
				isLoading={alertsListData.isLoading}
				onRowClick={handleRowClick}
				records={alertsListData.data}
				rowIdAccessor="_id"
				selectedId={alertId}
			/>
		</Pane>
	);
}
