/* * */

import { API_ROUTES, PAGE_ROUTES } from '@tmlmobilidade/consts';
import { Plan } from '@tmlmobilidade/go-types-operation';
import { AgencyTag, Button, Divider, fetchApiData, Grid, Label, ProcessingStatusDisplay, Section, Tooltip, useHandleAction, ValidityStatusDisplay } from '@tmlmobilidade/ui';
import { useRouter } from 'next/navigation';

import { AgencyDisplay } from '../../../common/AgencyDisplay';
import { FeedInfoDisplay } from '../../../common/FeedInfoDisplay';
import { useGtfsValidationsDetailData } from '../../detail/use-gtfs-validations-detail-data';
import { useGtfsValidationsAgenciesData } from '../../shared/use-gtfs-validations-agencies-data';
import { closeGtfsValidationsApproveModal } from '../GtfsValidationsApprove.modal';

/* * */

export function GtfsValidationsApprove() {
	//

	//
	// A. Setup variables

	const router = useRouter();

	const { data: gtfsValidationData, isLoading } = useGtfsValidationsDetailData();

	const { data: agenciesData } = useGtfsValidationsAgenciesData({
		permissions: { actions: ['create'], scope: 'plans' },
	});

	//
	// B. Handle actions

	const { action: handleApproveGtfsValidation, isLoading: isApprovingGtfsValidation } = useHandleAction({
		fetchFn: async () => await fetchApiData<Plan>({ method: 'GET', url: API_ROUTES.operation.GTFS_VALIDATIONS_DETAIL_APPROVE(gtfsValidationData._id) }),
		onSuccess: ({ data }) => {
			if (!data?._id) return;
			router.push(PAGE_ROUTES.operation.PLANS_DETAIL(data._id));
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
						disabled={isLoading}
						label="Cancelar"
						onClick={closeGtfsValidationsApproveModal}
						variant="secondary"
					/>
					<Tooltip label="Lembra-te de ajustar as datas de validade do plano depois de aprovado">
						<Button
							label="Aprovar"
							loading={isApprovingGtfsValidation}
							onClick={handleApproveGtfsValidation}
						/>
					</Tooltip>
				</Grid>
			</Section>

		</>
	);
}
