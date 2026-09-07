'use client';

import { PlanPostersExportModalBody } from '@/components/plans/posters/PlanPostersModalBody';
import { PlanPostersExportModalHeader } from '@/components/plans/posters/PlanPostersModalHeader';
import { closeModal } from '@tmlmobilidade/ui';

import { PLAN_POSTERS_EXPORT_MODAL_ID } from './constants';

/* * */

export function PlanPostersExportModal() {
	//

	//
	// A. Render components

	return (
		<div style={{ minHeight: '200px' }}>
			<PlanPostersExportModalHeader onClose={() => closeModal(PLAN_POSTERS_EXPORT_MODAL_ID)} />
			<PlanPostersExportModalBody />
		</div>
	);

	//
}
