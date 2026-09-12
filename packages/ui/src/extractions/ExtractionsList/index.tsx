'use client';

import { type Extraction } from '@tmlmobilidade/go-types-extractions';
import { DataTable, type DataTableColumn, ErrorDisplay, IdTag, Pane } from '@tmlmobilidade/ui';
import { useTranslation } from 'react-i18next';

import { ExtractionsListHeader } from '../ExtractionsListHeader';
import { ExtractionsListFilterBar } from '../filters/ExtractionsListFilterBar';
import { useExtractionsListData } from '../use-extractions-list-data';

/* * */

export function ExtractionsList() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const { data, error, isLoading } = useExtractionsListData();

	const columns: DataTableColumn<Extraction>[] = [
		{
			accessor: '_id',
			render: item => <IdTag id={item._id} />,
			title: t('default:organizations.list.table.columns.id.label'),
			width: 100,
		},
		{
			accessor: 'long_name',
			title: t('default:organizations.list.table.columns.name.label'),
			width: 600,
		},
	];

	//
	// B. Render components

	return (
		<Pane header={[
			<ExtractionsListHeader key="header" />,
			<ExtractionsListFilterBar key="filter-bar" />,
		]}
		>
			{error && <ErrorDisplay message={error} />}
			<DataTable
				columns={columns}
				isLoading={isLoading}
				// onRowClick={handleRowClick}
				records={data}
			/>
		</Pane>
	);
}
