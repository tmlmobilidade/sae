'use client';

import { PlanExportModalBody } from '@/components/plans/exporter/PlanExportModalBody';
import { PlanExportModalHeader } from '@/components/plans/exporter/PlanExportModalHeader';
import { closeModal } from '@tmlmobilidade/ui';

import { PLAN_EXPORT_MODAL_ID } from './constants';

/* * */

export function PlanExportModal() {
	//

	//
	// A. Setup variables

	//
	// B. Render components

	return (
		<div style={{ minHeight: '200px' }}>
			<PlanExportModalHeader onClose={() => closeModal(PLAN_EXPORT_MODAL_ID)} />
			<PlanExportModalBody />
		</div>
	);

	//
}
