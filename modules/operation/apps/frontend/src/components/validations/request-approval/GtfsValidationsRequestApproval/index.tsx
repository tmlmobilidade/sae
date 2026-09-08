/* * */

import { API_ROUTES } from '@tmlmobilidade/consts';
import { Plan } from '@tmlmobilidade/go-types-operation';
import { AgencyTag, Button, Divider, fetchApiData, Grid, Label, ProcessingStatusDisplay, Section, useHandleAction, ValidityStatusDisplay } from '@tmlmobilidade/ui';

import { AgencyDisplay } from '../../../common/AgencyDisplay';
import { FeedInfoDisplay } from '../../../common/FeedInfoDisplay';
import { useGtfsValidationsDetailData } from '../../detail/use-gtfs-validations-detail-data';
import { useGtfsValidationsAgenciesData } from '../../shared/use-gtfs-validations-agencies-data';
import { closeGtfsValidationsRequestApprovalModal } from '../GtfsValidationsRequestApproval.modal';

/* * */

export function GtfsValidationsRequestApproval() {
	//

	//
	// A. Setup variables

	const { data: gtfsValidationData, isLoading, mutate } = useGtfsValidationsDetailData();

	const { data: agenciesData } = useGtfsValidationsAgenciesData({
		permissions: { actions: ['request_approval'], scope: 'gtfs_validations' },
	});

	//
	// B. Handle actions

	const { action: handleRequestApprovalGtfsValidation, isLoading: isLoadingGtfsValidationRequestApproval } = useHandleAction({
		fetchFn: async () => await fetchApiData<Plan>({ method: 'GET', url: API_ROUTES.operation.GTFS_VALIDATIONS_DETAIL_REQUEST_APPROVAL(gtfsValidationData._id) }),
		onSuccess: () => {
			mutate();
			closeGtfsValidationsRequestApprovalModal();
		},
	});

	//
	// C. Render components

	return (
		<>

			<Section alignItems="center" flexDirection="row" gap="lg">
				<ProcessingStatusDisplay value={gtfsValidationData.processing_status} />
				<ValidityStatusDisplay value={gtfsValidationData.validity_status} />
				<AgencyTag
					agencyId={gtfsValidationData?.agency_id}
					data={agenciesData}
					showShortName
				/>
				<Label size="md" caps>{gtfsValidationData._id}</Label>
			</Section>

			<Divider />

			{gtfsValidationData.gtfs_agency && (
				<>
					<Section gap="sm">
						<Label size="lg">agency.txt</Label>
						<AgencyDisplay data={gtfsValidationData.gtfs_agency} />
					</Section>
					<Divider />
				</>
			)}

			{gtfsValidationData.gtfs_feed_info && (
				<>
					<Section gap="sm">
						<Label size="lg">feed_info.txt</Label>
						<FeedInfoDisplay data={gtfsValidationData.gtfs_feed_info} />
					</Section>
					<Divider />
				</>
			)}

			<Section>
				<Grid columns="ab" gap="md">
					<Button
						disabled={isLoading || isLoadingGtfsValidationRequestApproval}
						label="Cancelar"
						onClick={closeGtfsValidationsRequestApprovalModal}
						variant="secondary"
					/>
					<Button
						label="Solicitar Aprovação"
						loading={isLoadingGtfsValidationRequestApproval}
						onClick={handleRequestApprovalGtfsValidation}
					/>
				</Grid>
			</Section>

		</>
	);
}
