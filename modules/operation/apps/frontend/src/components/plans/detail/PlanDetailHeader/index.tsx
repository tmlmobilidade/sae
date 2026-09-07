'use client';

import { openPlanChangeModal } from '@/components/plans/change/PlanChange.modal';
import { usePlanDetailContext } from '@/components/plans/detail/PlanDetailForm.context';
import { usePlansAgenciesData } from '@/components/plans/shared/use-plans-agencies-data';
import { IconRefresh } from '@tabler/icons-react';
import { PAGE_ROUTES } from '@tmlmobilidade/consts';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { AgencyTag, CloseButton, DeleteButton, HasPermission, IconButton, IdTag, LockButton, Spacer, Toolbar, UpdateButton } from '@tmlmobilidade/ui';
import { keepUrlParams } from '@tmlmobilidade/ui';
import { useRouter } from 'next/navigation';

/* * */

export function PlanDetailHeader() {
	//

	//
	// A. Setup variables

	const router = useRouter();
	const planDetailContext = usePlanDetailContext();

	const { data: agenciesData } = usePlansAgenciesData();

	//
	// B. Handle actions

	const handleClose = () => {
		router.push(keepUrlParams(PAGE_ROUTES.operation.PLANS_LIST));
	};

	//
	// C. Render components

	return (
		<Toolbar>

			<CloseButton onClick={handleClose} type="close" />

			<IdTag id={planDetailContext.data.plan._id} copyOnClick />

			<AgencyTag
				agencyId={planDetailContext.data.plan.agency_id}
				data={agenciesData}
				showShortName
			/>

			<Spacer />

			<HasPermission
				action={PermissionCatalog.all.plans.actions.update}
				resourceKey="agency_ids"
				scope={PermissionCatalog.all.plans.scope}
				value={planDetailContext.data.plan.agency_id}
			>
				<UpdateButton
					isDisabled={!planDetailContext.flags.canSave}
					isLoading={planDetailContext.flags.isSaving}
					onClick={planDetailContext.actions.save}
				/>
			</HasPermission>

			<HasPermission
				action={PermissionCatalog.all.plans.actions.update_gtfs_plan}
				resourceKey="agency_ids"
				scope={PermissionCatalog.all.plans.scope}
				value={planDetailContext.data.plan.agency_id}
			>
				<IconButton
					icon={<IconRefresh />}
					isDisabled={!planDetailContext.flags.canChangePlan}
					onClick={() => openPlanChangeModal(planDetailContext.data.plan._id)}
					tooltip="Alterar Plano"
				/>
			</HasPermission>

			<HasPermission
				action={PermissionCatalog.all.plans.actions.lock}
				resourceKey="agency_ids"
				scope={PermissionCatalog.all.plans.scope}
				value={planDetailContext.data.plan.agency_id}
			>
				<LockButton
					isDisabled={!planDetailContext.flags.canLock}
					isLoading={planDetailContext.flags.isLocking}
					isLocked={planDetailContext.data.plan?.is_locked}
					onClick={planDetailContext.actions.lock}
				/>
			</HasPermission>

			<HasPermission
				action={PermissionCatalog.all.plans.actions.delete}
				resourceKey="agency_ids"
				scope={PermissionCatalog.all.plans.scope}
				value={planDetailContext.data.plan.agency_id}
			>
				<DeleteButton
					confirmMessage="Tem a certeza que pretende eliminar este plano? O plano ficará indisponível para utilização futura."
					confirmTitle="Eliminar Plano"
					isDisabled={!planDetailContext.flags.canDelete}
					isLoading={planDetailContext.flags.isDeleting}
					onDelete={planDetailContext.actions.delete}
					onRestore={planDetailContext.actions.delete}
					showConfirmation={true}
				/>
			</HasPermission>

		</Toolbar>
	);
}
