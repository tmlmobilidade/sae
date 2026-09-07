'use client';

import { usePlansExportPdfsContext } from '@/contexts/PlansExportPdfs.context';
import { IconFileTypePdf } from '@tabler/icons-react';
import { Button, CloseButton, Label, Spacer, Toolbar } from '@tmlmobilidade/ui';

/* * */

interface PlanPostersExportModalHeaderProps {
	onClose: () => void
}

/* * */

export function PlanPostersExportModalHeader({ onClose }: PlanPostersExportModalHeaderProps) {
	//

	//
	// A. Setup variables

	const context = usePlansExportPdfsContext();

	//
	// B. Render components

	return (
		<Toolbar>
			<CloseButton onClick={onClose} type="close" />
			<Label size="lg" caps singleLine>Gerar PDFs</Label>
			<Spacer />
			<Button
				disabled={!context.flags.canSave}
				icon={<IconFileTypePdf />}
				label="Gerar PDFs"
				loading={context.flags.loading}
				onClick={context.actions.exportPosters}
			/>
		</Toolbar>
	);

	//
}
