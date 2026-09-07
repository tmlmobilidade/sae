import { PlanExportModalContextProvider } from '@/components/plans/exporter/PlanExportForm.context';
import { ExportsContextProvider, MeContextProvider, openModal } from '@tmlmobilidade/ui';

import { PlanExportModal } from '../PlanExportModal';
import { PLAN_EXPORT_MODAL_ID } from '../PlanExportModal/constants';

export { PLAN_EXPORT_MODAL_ID } from '../PlanExportModal/constants';

/* * */

export const openPlanExportModal = () => {
	openModal({
		children: (
			<MeContextProvider>
				<ExportsContextProvider>
					<PlanExportModalContextProvider>
						<PlanExportModal />
					</PlanExportModalContextProvider>
				</ExportsContextProvider>
			</MeContextProvider>
		),
		closeOnClickOutside: false,
		modalId: PLAN_EXPORT_MODAL_ID,
		padding: 0,
		size: 'xl',
		styles: { content: { overflow: 'scroll' } },
		withCloseButton: false,
	});
};
