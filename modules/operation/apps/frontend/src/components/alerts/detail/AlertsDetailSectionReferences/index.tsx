'use client';

import { type Alert, AlertReferenceTypeValues } from '@tmlmobilidade/go-types-operation';
import { Collapsible, LoadingSection, NoDataLabel, Section, useStandardFormWatch } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReferencesEditor } from '../../references/shared/ReferencesEditor';
import { useAlertsAgenciesData } from '../../shared/use-alerts-agencies-data';
import { useAlertsDetailFormContext } from '../AlertsDetailForm.context';

/* * */

export function AlertsDetailSectionReferences() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const { form } = useAlertsDetailFormContext();

	const agencyIdValue = useStandardFormWatch({ control: form.control, name: 'agency_id' });
	const causeValue = useStandardFormWatch({ control: form.control, name: 'cause' });
	const effectValue = useStandardFormWatch({ control: form.control, name: 'effect' });
	const activePeriodEndDateValue = useStandardFormWatch({ control: form.control, name: 'active_period_end_date' });
	const activePeriodStartDateValue = useStandardFormWatch({ control: form.control, name: 'active_period_start_date' });
	const referencesValue = useStandardFormWatch({ control: form.control, name: 'references' });
	const referenceTypeValue = useStandardFormWatch({ control: form.control, name: 'reference_type' });

	const { data: agenciesData, isLoading: agenciesLoading } = useAlertsAgenciesData({
		permissions: { actions: ['read'], scope: 'alerts' },
	});

	//
	// C. Transform data

	const preparedOptions = useMemo(() => {
		// Find the agency data that matches the selected agency_id in the form.
		const matchingAgencyData = agenciesData?.find(item => item._id === agencyIdValue);
		if (!matchingAgencyData) return [];
		// Only show effects that have at least one reference_type enabled (cause > effect > reference_type = true).
		// Map to the format needed for rendering the buttons
		// and sort alphabetically by label.
		return AlertReferenceTypeValues
			.filter(referenceTypeValue => !!matchingAgencyData.alerts.catalog?.[causeValue]?.[effectValue]?.[referenceTypeValue])
			.sort((a, b) => a.localeCompare(b));
	}, [agenciesData, agencyIdValue, causeValue, effectValue]);

	//
	// D. Handle actions

	const handleChangeReferenceType = (value: Alert['reference_type']) => {
		form.setValue('reference_type', value, { shouldDirty: true });
	};

	const handleChangeReferences = (value: Alert['references']) => {
		form.setValue('references', value, { shouldDirty: true });
	};

	//
	// E. Render components

	if (agenciesLoading) {
		return <LoadingSection />;
	}

	if (!preparedOptions.length) {
		return (
			<Section alignItems="center" height="100%" justifyContent="center" padding="lg">
				<NoDataLabel text={t('alerts:create.references.no_data')} />
			</Section>
		);
	}

	return (
		<Collapsible
			description="Linhas, paragens ou circulações impactadas por este alerta."
			title="Referências"
			defaultOpen
		>
			<ReferencesEditor
				activePeriodEndDate={activePeriodEndDateValue}
				activePeriodStartDate={activePeriodStartDateValue}
				enabledReferenceTypes={preparedOptions}
				onChangeReferences={handleChangeReferences}
				onChangeReferenceType={handleChangeReferenceType}
				selectedAgencyId={agencyIdValue}
				selectedReferences={referencesValue}
				selectedReferenceType={referenceTypeValue}
			/>
		</Collapsible>
	);
}
