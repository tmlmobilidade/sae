/* * */

import { AlertsComposeRequest } from '@tmlmobilidade/go-operation-pckg-types';
import { hasPermissionResource } from '@tmlmobilidade/go-types-permissions';
import { Divider, Inline, Label, LoadingThinking, Section, StandardFormController, Surface, Switch, Text, TextInput, useDebouncedValue, useMeData, useStandardFormWatch } from '@tmlmobilidade/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAlertsComposeData } from '../../shared/use-alerts-compose-data';
import { useAlertsDetailFormContext } from '../AlertsDetailForm.context';

/* * */

export function AlertsDetailSectionTextsAi() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const { data: meData } = useMeData();

	const { form } = useAlertsDetailFormContext();

	const agencyIdValue = useStandardFormWatch({ control: form.control, name: 'agency_id' });
	const autoTextsValue = useStandardFormWatch({ control: form.control, name: 'auto_texts' });
	const titleValue = useStandardFormWatch({ control: form.control, name: 'title' });
	const descriptionValue = useStandardFormWatch({ control: form.control, name: 'description' });
	const activePeriodEndDateValue = useStandardFormWatch({ control: form.control, name: 'active_period_end_date' });
	const activePeriodStartDateValue = useStandardFormWatch({ control: form.control, name: 'active_period_start_date' });
	const causeValue = useStandardFormWatch({ control: form.control, name: 'cause' });
	const effectValue = useStandardFormWatch({ control: form.control, name: 'effect' });
	const referenceTypeValue = useStandardFormWatch({ control: form.control, name: 'reference_type' });
	const referencesValue = useStandardFormWatch({ control: form.control, name: 'references' });
	const userInstructionsValue = useStandardFormWatch({ control: form.control, name: 'user_instructions' });

	const [debouncedUserInstructions] = useDebouncedValue(userInstructionsValue, 1_000, { leading: false });

	//
	// B. Transform data

	const requestBody = useMemo<AlertsComposeRequest>(() => ({
		active_period_end_date: activePeriodEndDateValue,
		active_period_start_date: activePeriodStartDateValue,
		agency_id: agencyIdValue,
		cause: causeValue,
		effect: effectValue,
		reference_type: referenceTypeValue,
		references: referencesValue,
		user_instructions: debouncedUserInstructions,
	}), [agencyIdValue, activePeriodEndDateValue, activePeriodStartDateValue, causeValue, effectValue, referenceTypeValue, referencesValue, debouncedUserInstructions]);

	const { data: composeData, isLoading: isLoadingComposeData, isValidating: isValidatingComposeData } = useAlertsComposeData(requestBody);

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

	const hasPermissionToUpdateTexts = useMemo(() =>	{
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

	const isProposalAccepted = useMemo(() => {
		const isSameTitle = composeData?.pt?.title === titleValue;
		const isSameDescription = composeData?.pt?.description === descriptionValue;
		return isSameTitle && isSameDescription;
	}, [composeData?.pt?.description, composeData?.pt?.title, descriptionValue, titleValue]);

	//
	// C. Handle actions

	const handleAcceptProposal = () => {
		form.setValue('title', composeData?.pt?.title);
		form.setValue('description', composeData?.pt?.description);
	};

	//
	// D. Render components

	return (
		<Section gap="md">
			<Surface variant="bordered" withBackground>

				<Section gap="md">
					{(hasPermissionToUpdate || hasPermissionToUpdateTexts) && (
						<StandardFormController
							control={form.control}
							name="auto_texts"
							render={({ field }) => (
								<Switch
									checked={field.value ?? false}
									disabled={!hasPermissionToUpdateTexts}
									label={t('alerts:create.summary.auto_texts.label')}
									onChange={e => field.onChange(e.currentTarget.checked)}
								/>
							)}
						/>
					)}

					{(autoTextsValue && hasPermissionToUpdate) && (
						<StandardFormController
							control={form.control}
							name="user_instructions"
							render={({ field }) => (
								<TextInput
									label={t('alerts:create.summary.user_instructions.label')}
									loading={isLoadingComposeData}
									onBlur={field.onBlur}
									onChange={e => field.onChange(e.currentTarget.value)}
									placeholder={t('alerts:create.summary.user_instructions.placeholder')}
									value={field.value ?? ''}
									w="100%"
								/>
							)}
						/>
					)}
				</Section>

				{(autoTextsValue && hasPermissionToUpdate && (composeData || isLoadingComposeData || isValidatingComposeData)) && (
					<>

						<Divider lineStyle="dashed" />

						<Section>

							{composeData && (
								<Section gap="sm" padding="none">
									<Label size="md" variant="muted" caps>Proposta</Label>
									<Text weight="semibold">{composeData.pt.title}</Text>
									<Text>{composeData.pt.description}</Text>
									{!isProposalAccepted && <Inline onClick={handleAcceptProposal} dotted>Aceitar proposta</Inline>}
								</Section>
							)}

							<LoadingThinking
								size="md"
								text="Generating summary..."
								visible={isLoadingComposeData || isValidatingComposeData}
							/>

						</Section>

					</>
				)}

			</Surface>
		</Section>
	);
}
