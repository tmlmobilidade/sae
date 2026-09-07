import { PlanPostersExportModal } from '@/components/plans/posters/PlanPostersModal';
import { PLAN_POSTERS_EXPORT_MODAL_ID } from '@/components/plans/posters/PlanPostersModal/constants';
import { PlansExportPdfsModalContextProvider } from '@/contexts/PlansExportPdfs.context';
import { ExportsContextProvider, MeContextProvider, openModal } from '@tmlmobilidade/ui';

/* * */

export const openPlanPostersExportModal = () => {
	openModal({
		children: (
			<MeContextProvider>
				<ExportsContextProvider>
					<PlansExportPdfsModalContextProvider>
						<PlanPostersExportModal />
					</PlansExportPdfsModalContextProvider>
				</ExportsContextProvider>
			</MeContextProvider>
		),
		closeOnClickOutside: false,
		modalId: PLAN_POSTERS_EXPORT_MODAL_ID,
		padding: 0,
		size: 'xl',
		styles: { content: { overflow: 'scroll' } },
		withCloseButton: false,
	});
};
