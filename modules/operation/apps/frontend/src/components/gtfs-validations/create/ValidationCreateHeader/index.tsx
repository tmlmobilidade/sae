'use client';

import { closeCreateValidationModal } from '@/components/gtfs-validations/create/ValidationCreate.modal';
import { AgencyTag, Button, CloseButton, Label, Spacer, Toolbar } from '@tmlmobilidade/ui';

import { useGtfsValidationsAgenciesData } from '../../shared/use-gtfs-validations-agencies-data';
import { useValidationCreateContext } from '../ValidationCreateForm.context';

/* * */

export function ValidationCreateHeader() {
	//

	//
	// A. Setup variables

	const validationCreateContext = useValidationCreateContext();

	const { data: agenciesData } = useGtfsValidationsAgenciesData({
		permissions: { actions: ['create'], scope: 'gtfs_validations' },
	});

	//
	// B. Render components

	return (
		<Toolbar>
			<CloseButton onClick={closeCreateValidationModal} type="close" />
			<Label size="lg" caps singleLine>Nova Validação GTFS</Label>
			<AgencyTag
				agencyId={validationCreateContext.data.selectedAgencyId}
				data={agenciesData}
			/>
			<Spacer />
			<Button
				disabled={!validationCreateContext.capabilities?.createEnabled}
				label="Criar validação"
				loading={validationCreateContext.status.isCreating}
				onClick={validationCreateContext.actions.create}
			/>
		</Toolbar>
	);
}
