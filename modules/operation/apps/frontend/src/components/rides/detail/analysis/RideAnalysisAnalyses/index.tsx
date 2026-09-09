'use client';

import { useRidesDetailRideAnalysesData } from '@/components/rides/detail/shared/use-rides-detail-ride-analyses-data';
import { type RideAnalysesRegistry } from '@tmlmobilidade/go-types-operation';
import { Collapsible, DataTable, DataTableColumn, DataTableScroller, GradeStatusDisplay, Label, Section, Text } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/* * */

export function RideAnalysisAnalyses() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const { data: rideAnalysesData } = useRidesDetailRideAnalysesData();

	const columns: DataTableColumn<{ key: keyof RideAnalysesRegistry, value: RideAnalysesRegistry[keyof RideAnalysesRegistry] }>[] = [
		{
			accessor: 'id',
			render: item => (
				<Section flexDirection="column" gap="xs" padding="none">
					<Label size="sm">{item.key}</Label>
					<Label>{t(`ride_analysis:${item.key}.label`)}</Label>
					<Text size="sm" textWrap="wrap">{t(`ride_analysis:${item.key}.description`)}</Text>
				</Section>
			),
			title: t('default:rides.analysis.RideAnalysisAnalyses.table.columns.id.label'),
			width: 500,
		},
		{
			accessor: 'grade_status',
			render: item => item.value ? <GradeStatusDisplay tooltip={item.value?.remarks} value={item.value?.grade_status} /> : 'N/A',
			title: t('default:rides.analysis.RideAnalysisAnalyses.table.columns.grade_status.label'),
			width: 100,
		},
		{
			accessor: 'reason',
			render: item => <Label>{item.value?.reason}</Label>,
			title: t('default:rides.analysis.RideAnalysisAnalyses.table.columns.reason.label'),
			width: 500,
		},
	];

	//
	// B. Transform data

	const rideAnalysesList: { key: keyof RideAnalysesRegistry, value: null | RideAnalysesRegistry[keyof RideAnalysesRegistry] }[] = useMemo(() => {
		if (!rideAnalysesData) return [];
		return (Object.entries(rideAnalysesData) as [keyof RideAnalysesRegistry, RideAnalysesRegistry[keyof RideAnalysesRegistry]][])
			.sort(([aKey], [bKey]) => aKey.localeCompare(bKey))
			.map(([key, value]) => ({ key, value }));
	}, [rideAnalysesData]);

	//
	// C. Render components

	return (
		<Collapsible
			description={t('default:rides.analysis.RideAnalysisResult.description')}
			title={t('default:rides.analysis.RideAnalysisResult.title')}
		>
			<DataTableScroller>
				<DataTable
					columns={columns}
					records={rideAnalysesList}
					rowIdAccessor="key"
				/>
			</DataTableScroller>
		</Collapsible>
	);
}
