'use client';

import { usePlanExportModalContext } from '@/components/plans/exporter/PlanExportForm.context';
import { IconFileDownload } from '@tabler/icons-react';
import { Button, CloseButton, Label, Spacer, Toolbar } from '@tmlmobilidade/ui';

/* * */

interface PlanExportModalHeaderProps {
	onClose: () => void
}

/* * */

export function PlanExportModalHeader({ onClose }: PlanExportModalHeaderProps) {
	//

	//
	// A. Setup variables

	const context = usePlanExportModalContext();

	//
	// B. Render components

	return (
		<Toolbar>
			<CloseButton onClick={onClose} type="close" />
			<Label size="lg" caps singleLine>Exportar plano</Label>
			<Spacer />
			<Button
				disabled={!context.flags.canSave}
				icon={<IconFileDownload />}
				label="Exportar"
				loading={context.flags.loading}
				onClick={context.actions.exportPlan}
			/>
		</Toolbar>
	);

	//
}
