'use client';

import { IconDownload } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { IconButton } from '../../../buttons';
import { openExtractionsListModal } from '../../../extractions';

/* * */

export function SidebarExtractions() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	//
	// B. Render components

	return (
		<IconButton
			icon={<IconDownload />}
			onClick={openExtractionsListModal}
			tooltip={t('shared:components.sidebar.SidebarExtractions.tooltip')}
			variant="default"
		/>
	);
}
