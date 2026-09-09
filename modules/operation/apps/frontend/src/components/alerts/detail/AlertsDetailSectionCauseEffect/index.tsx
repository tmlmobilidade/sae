'use client';

import { AlertCauseValues, AlertEffectValues } from '@tmlmobilidade/go-types-operation';
import { hasPermissionResource } from '@tmlmobilidade/go-types-permissions';
import { AlertCauseIcons, AlertEffectIcons, Collapsible, Grid, Section, Select, StandardFormController, useMeData, useStandardFormWatch } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAlertsDetailFormContext } from '../AlertsDetailForm.context';

/* * */

export function AlertsDetailSectionCauseEffect() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const { data: meData } = useMeData();

	const { form } = useAlertsDetailFormContext();

	const agencyIdValue = useStandardFormWatch({ control: form.control, name: 'agency_id' });
	const referenceTypeValue = useStandardFormWatch({ control: form.control, name: 'reference_type' });

	//
	// B. Transform data

	const hasPermissionToUpdate = useMemo(() => {
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

	const causeItems = AlertCauseValues.map(cause => ({
		icon: AlertCauseIcons[cause],
		label: t(`shared:alerts.causes.${cause}.title`),
		value: cause,
	}));

	const effectItems = AlertEffectValues.map(effect => ({
		icon: AlertEffectIcons[effect],
		label: t(`shared:alerts.effects.${effect}.title`),
		value: effect,
	}));

	//
	// C. Render components

	return (
		<Collapsible
			description="A causa é o que aconteceu, o efeito é o que aconteceu como consequência."
			title="Causa e Efeito"
			defaultOpen
		>
			<Section>
				<Grid columns="ab" gap="md">
					<StandardFormController
						control={form.control}
						name="cause"
						render={({ field, fieldState }) => (
							<Select
								data={causeItems}
								description="O que aconteceu"
								error={fieldState.error?.message}
								label="Causa"
								onChange={field.onChange}
								readOnly={!hasPermissionToUpdate}
								value={field.value}
							/>
						)}
					/>
					<StandardFormController
						control={form.control}
						name="effect"
						render={({ field, fieldState }) => (
							<Select
								data={effectItems}
								description="O que aconteceu como consequência"
								error={fieldState.error?.message}
								label="Efeito"
								onChange={field.onChange}
								readOnly={!hasPermissionToUpdate}
								value={field.value}
							/>
						)}
					/>
				</Grid>
			</Section>
		</Collapsible>
	);
}
