'use client';

import { usePlansExportPdfsContext } from '@/contexts/PlansExportPdfs.context';
import { Dates } from '@tmlmobilidade/dates';
import { type PlanPostersContentMode, type PlanPostersFilterMode } from '@tmlmobilidade/go-types-downloads';
import { Divider, MultiSelect, Section, SegmentedControl, Select } from '@tmlmobilidade/ui';
import { useMemo } from 'react';

/* * */

const canvasProfileOptions = [
	{ label: '0Master.A', value: '0Master.A' },
	{ label: '0Master.B', value: '0Master.B' },
	{ label: '0Master.C', value: '0Master.C' },
	{ label: '0Master.F', value: '0Master.F' },
];

/* * */

export function PlanPostersExportModalBody() {
	//

	//
	// A. Setup variables

	const context = usePlansExportPdfsContext();

	const plansOptions = useMemo(() => context.data.plans
		.filter(plan => !!plan.operation_file_id && plan.agency_id === context.data.agencyId)
		.map((plan) => {
			const startDate = Dates.fromOperationalDate(plan.gtfs_feed_info.feed_start_date, 'Europe/Lisbon').toFormat('dd-MM-yyyy');
			const endDate = Dates.fromOperationalDate(plan.gtfs_feed_info.feed_end_date, 'Europe/Lisbon').toFormat('dd-MM-yyyy');

			return {
				label: `#${plan._id} · ${startDate} - ${endDate}`,
				value: plan._id,
			};
		}), [context.data.agencyId, context.data.plans]);

	//
	// D. Render components

	return (
		<>
			<Divider />

			<Section gap="md">
				<Select
					data={context.data.agencyOptions}
					description="Os planos e as opções de exportação são apresentados para este operador"
					label="Selecionar operador"
					onChange={context.actions.setAgencyId}
					value={context.data.agencyId}
					w="100%"
				/>
			</Section>
			<Divider />

			<Section gap="md">
				<Select
					data={plansOptions}
					description="Selecione um plano"
					disabled={!context.data.agencyId}
					label="Selecionar plano"
					onChange={context.actions.setPlanId}
					value={context.data.planId}
					w="100%"
				/>
			</Section>
			<Divider />

			{context.data.planId && (
				<Section gap="md">
					<SegmentedControl
						fullWidth={true}
						label="Conteúdo a exportar"
						onChange={value => context.actions.setContentMode(value as PlanPostersContentMode)}
						value={context.data.contentMode}
						data={[
							{ label: 'Tudo', value: 'all' },
							{ label: 'Linhas', value: 'lines' },
							{ label: 'Paragens', value: 'stops' },
						]}
					/>

					{context.data.contentMode !== 'all' && (
						<SegmentedControl
							fullWidth={true}
							label={context.data.contentMode === 'lines' ? 'Filtro de linhas' : 'Filtro de paragens'}
							onChange={value => context.actions.setFilterMode(value as PlanPostersFilterMode)}
							value={context.data.filterMode}
							data={[
								{ label: 'Apenas selecionadas', value: 'include' },
								{ label: 'Todas exceto selecionadas', value: 'exclude' },
							]}
						/>
					)}

					{context.data.contentMode === 'lines' && (
						<MultiSelect
							key={`${context.data.agencyId}-lines-${context.data.filterMode}`}
							data={context.data.lineOptions}
							description={context.data.filterMode === 'include' ? 'Apenas estas linhas serão exportadas.' : 'Todas as linhas serão exportadas, exceto estas.'}
							onChange={context.actions.setLineIds}
							placeholder="Selecionar linhas"
							value={context.data.lineIds}
							w="100%"
						/>
					)}

					{context.data.contentMode === 'stops' && (
						<MultiSelect
							key={`${context.data.agencyId}-stops-${context.data.filterMode}`}
							data={context.data.stopOptions}
							description={context.data.filterMode === 'include' ? 'Apenas estas paragens serão exportadas.' : 'Todas as paragens serão exportadas, exceto estas.'}
							onChange={context.actions.setStopIds}
							placeholder="Selecionar paragens"
							value={context.data.stopIds}
							w="100%"
						/>
					)}

					{context.data.contentMode !== 'all' && (
						<Select
							data={canvasProfileOptions}
							description="Este perfil será aplicado às paragens exportadas"
							label="Canvas profile"
							onChange={value => context.actions.setCanvasProfile(value as typeof context.data.canvasProfile)}
							value={context.data.canvasProfile}
							w="100%"
						/>
					)}

				</Section>
			)}
		</>
	);

	//
}
