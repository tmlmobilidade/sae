/* * */

import { openPlanExportModal } from '@/components/plans/exporter/PlanExportModalOpen';
import { PlansListFilterSearch } from '@/components/plans/list/filters/PlansListFilterSearch';
import { openPlanPostersExportModal } from '@/components/plans/posters/PlanPostersModalOpen';
import { IconDots, IconFileDownload, IconFileTypePdf } from '@tabler/icons-react';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { HasPermission, Label, LoadingActivity, Menu, MenuItem, MenuLabel, Spacer, Toolbar } from '@tmlmobilidade/ui';

import { usePlansListData } from '../use-plans-list-data';

/* * */

export function PlansListHeader() {
	//

	//
	// A. Setup variables

	const { isLoading, isValidating, timestamp } = usePlansListData();

	//
	// B. Render components

	return (
		<Toolbar>
			<Label size="lg" caps singleLine>Planos</Label>
			<LoadingActivity isLoading={isLoading} isValidating={isValidating} timestamp={timestamp} />
			<Spacer />
			<PlansListFilterSearch />
			<Menu icon={IconDots} label="Exportar">
				<MenuLabel>Exportações</MenuLabel>
				<MenuItem
					leftSection={<IconFileDownload size={20} />}
					onClick={openPlanExportModal}
					title="Exportar GTFS"
				/>
				<HasPermission action={PermissionCatalog.all.plans.actions.generate_pdf_posters} scope={PermissionCatalog.all.plans.scope}>
					<MenuItem
						leftSection={<IconFileTypePdf size={20} />}
						onClick={openPlanPostersExportModal}
						title="Gerar PDFs"
					/>
				</HasPermission>
			</Menu>
		</Toolbar>
	);
}
