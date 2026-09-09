'use client';

import { ApexValidationIsPassengerTag } from '@/components/common/ApexValidationIsPassengerTag';
import { ApexValidationStatusTag } from '@/components/common/ApexValidationStatusTag';
import { useRidesDetailApexValidationsData } from '@/components/rides/detail/shared/use-rides-detail-apex-validations-data';
import { type SimplifiedApexValidation } from '@tmlmobilidade/go-types-apex';
import { Collapsible, DataTable, DataTableColumn, DataTableScroller, IdTag, NumberDisplay, UnixMillisecondsDisplay } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/* * */

export function RideAnalysisApexValidations() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const { data: simplifiedApexValidationsData } = useRidesDetailApexValidationsData();

	const columns: DataTableColumn<SimplifiedApexValidation>[] = [
		{
			accessor: 'created_at',
			render: item => <UnixMillisecondsDisplay value={item.created_at} showDate />,
			title: t('default:rides.analysis.RideAnalysisApexValidations.table.columns.created_at.label'),
			width: 180,
		},
		{
			accessor: 'event_type',
			center: true,
			render: item => <NumberDisplay value={Number(item.event_type)} />,
			title: t('default:rides.analysis.RideAnalysisApexValidations.table.columns.event_type.label'),
			width: 50,
		},
		{
			accessor: 'stop_id',
			render: item => <IdTag id={item.stop_id} copyOnClick />,
			title: t('default:rides.analysis.RideAnalysisApexValidations.table.columns.stop_id.label'),
			width: 100,
		},
		{
			accessor: 'card_serial_number',
			render: item => <IdTag id={item.card_serial_number} copyOnClick />,
			title: t('default:rides.analysis.RideAnalysisApexValidations.table.columns.card_serial_number.label'),
			width: 190,
		},
		{
			accessor: 'product_id',
			title: t('default:rides.analysis.RideAnalysisApexValidations.table.columns.product_id.label'),
			width: 400,
		},
		{
			accessor: 'validation_status',
			render: item => <ApexValidationStatusTag value={item.validation_status} />,
			title: t('default:rides.analysis.RideAnalysisApexValidations.table.columns.status.label'),
			width: 250,
		},
		{
			accessor: 'is_passenger',
			render: item => <ApexValidationIsPassengerTag value={item.is_passenger} />,
			title: t('default:rides.analysis.RideAnalysisApexValidations.table.columns.tx_valid.label'),
			width: 125,
		},
		{
			accessor: 'vehicle_id',
			render: item => <IdTag id={item.vehicle_id} copyOnClick />,
			title: t('default:rides.analysis.RideAnalysisApexValidations.table.columns.vehicle_id.label'),
			width: 100,
		},
		{
			accessor: 'mac_sam_serial_number',
			render: item => <IdTag id={item.mac_sam_serial_number.toString()} copyOnClick />,
			title: t('default:rides.analysis.RideAnalysisApexValidations.table.columns.mac_sam_serial_number.label'),
			width: 160,
		},
		{
			accessor: '_id',
			render: item => <IdTag id={item._id} copyOnClick />,
			title: t('default:rides.analysis.RideAnalysisApexValidations.table.columns.id_validation.label'),
			width: 400,
		},
		{
			accessor: 'on_board_sale_id',
			render: item => item.on_board_sale_id && <IdTag id={item.on_board_sale_id} copyOnClick />,
			title: t('default:rides.analysis.RideAnalysisApexValidations.table.columns.id_on_board_sale.label'),
			width: 400,
		},
		{
			accessor: 'on_board_refund_id',
			render: item => item.on_board_refund_id && <IdTag id={item.on_board_refund_id} copyOnClick />,
			title: t('default:rides.analysis.RideAnalysisApexValidations.table.columns.id_on_board_refund.label'),
			width: 400,
		},
	];

	//
	// B. Transform data

	const sortedSimplifiedApexValidations = useMemo(() => {
		if (!simplifiedApexValidationsData?.length) return [];
		return simplifiedApexValidationsData?.sort((a, b) => a.created_at - b.created_at);
	}, [simplifiedApexValidationsData]);

	//
	// C. Render components

	return (
		<Collapsible
			description={t('default:rides.analysis.RideAnalysisApexValidations.description')}
			title={t('default:rides.analysis.RideAnalysisApexValidations.title')}
		>
			<DataTableScroller>
				<DataTable
					columns={columns}
					records={sortedSimplifiedApexValidations}
					rowIdAccessor="_id"
				/>
			</DataTableScroller>
		</Collapsible>
	);
}
