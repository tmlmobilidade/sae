'use client';

import { usePlanExportModalContext } from '@/components/plans/exporter/PlanExportForm.context';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { Divider, Section, Select } from '@tmlmobilidade/ui';
import { useMemo } from 'react';

/* * */

export function PlanExportModalBody() {
	//

	//
	// A. Setup variables

	const context = usePlanExportModalContext();
	const selectedAgencyId = context.data.agencyId;

	const plansOptions = useMemo(() => context.data.plans
		.filter(plan => plan.agency_id === selectedAgencyId)
		.map((plan) => {
			const startDate = Dates.fromOperationalDateInt(plan.active_from, 'Europe/Lisbon').toFormat('dd-MM-yyyy');
			const endDate = Dates.fromOperationalDateInt(plan.active_until, 'Europe/Lisbon').toFormat('dd-MM-yyyy');

			return {
				label: `#${plan._id} · ${startDate} - ${endDate}`,
				value: plan._id,
			};
		}), [context.data.plans, selectedAgencyId]);

	//
	// B. Render components

	return (
		<>
			<Divider />

			{context.data.agencyOptions.length > 1 && (
				<>
					<Section gap="md">
						<Select
							clearable={false}
							data={context.data.agencyOptions}
							label="Selecionar operador"
							onChange={context.actions.setAgencyId}
							value={selectedAgencyId ?? null}
							w="100%"
						/>
					</Section>
					<Divider />
				</>
			)}

			{selectedAgencyId && (
				<>
					<Section gap="md">
						<Select
							data={plansOptions}
							description="Selecione um plano deste operador"
							label="Selecionar plano"
							onChange={context.actions.setPlanId}
							value={context.data.planId}
							w="100%"
						/>
					</Section>
					<Divider />
				</>
			)}

		</>
	);

	//
}
