'use client';

import { hasPermissionResource } from '@tmlmobilidade/go-types-permissions';
import { Collapsible, DateTimeInput, Divider, Grid, Label, Section, StandardFormController, Text, useMeData, useStandardFormWatch } from '@tmlmobilidade/ui';
import { useMemo } from 'react';

import { useAlertsDetailFormContext } from '../AlertsDetailForm.context';

/* * */

export function AlertsDetailSectionDates() {
	//

	//
	// A. Setup variables

	const { data: meData } = useMeData();

	const { form } = useAlertsDetailFormContext();

	const agencyIdValue = useStandardFormWatch({ control: form.control, name: 'agency_id' });
	const referenceTypeValue = useStandardFormWatch({ control: form.control, name: 'reference_type' });

	//
	// B. Transform data

	const hasPermissionToUpdateDates = useMemo(() => {
		const permissionForAgencyId = hasPermissionResource(meData?.permissions, {
			requiredPermission: { action: 'update', scope: 'alerts' },
			requiredValue: agencyIdValue,
			resourceKey: 'agency_ids',
		});
		const permissionForReferenceType = hasPermissionResource(meData?.permissions, {
			requiredPermission: { action: 'update', scope: 'alerts' },
			requiredValue: referenceTypeValue,
			resourceKey: 'reference_types',
		});
		return permissionForAgencyId && permissionForReferenceType;
	}, [agencyIdValue, meData?.permissions, referenceTypeValue]);

	//
	// C. Render components

	return (
		<Collapsible
			description=""
			title="Datas de Vigência e Agendamento"
			defaultOpen
		>

			<Section gap="sm">
				<Label size="md" caps>Período de Vigência</Label>
				<Text size="sm" weight="medium">Período em que o alerta é válido. Distinto da visibilidade. O alerta pode estar visível mas não ser ainda válido (ex: um alerta para um corte de estrada é vísível uma semana antes, mas o corte em si é apenas durante 2 dias).</Text>
				<Grid columns="ab" gap="md">
					<StandardFormController
						control={form.control}
						name="active_period_start_date"
						render={({ field, fieldState }) => (
							<DateTimeInput
								error={fieldState.error?.message}
								label="Data de Início"
								onChange={field.onChange}
								readOnly={!hasPermissionToUpdateDates}
								value={field.value}
							/>
						)}
					/>
					<StandardFormController
						control={form.control}
						name="active_period_end_date"
						render={({ field, fieldState }) => (
							<DateTimeInput
								error={fieldState.error?.message}
								label="Data de Fim"
								onChange={field.onChange}
								readOnly={!hasPermissionToUpdateDates}
								value={field.value}
								clearable
							/>
						)}
					/>
				</Grid>
			</Section>

			<Divider />

			<Section gap="sm">
				<Label size="md" caps>Agendamento</Label>
				<Text size="sm" weight="medium">É possível agendar a permanência do alerta nos canais digitais. A visibilidade do alerta é diferente do seu período de vigência.</Text>
				<Grid columns="ab" gap="md">
					<StandardFormController
						control={form.control}
						name="publish_start_date"
						render={({ field, fieldState }) => (
							<DateTimeInput
								error={fieldState.error?.message}
								label="Data de Início"
								onChange={field.onChange}
								readOnly={!hasPermissionToUpdateDates}
								value={field.value}
								clearable
							/>
						)}
					/>
					<StandardFormController
						control={form.control}
						name="publish_end_date"
						render={({ field, fieldState }) => (
							<DateTimeInput
								error={fieldState.error?.message}
								label="Data de Fim"
								onChange={field.onChange}
								readOnly={!hasPermissionToUpdateDates}
								value={field.value}
								clearable
							/>
						)}
					/>
				</Grid>
			</Section>
		</Collapsible>
	);
}
