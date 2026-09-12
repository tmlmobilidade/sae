'use client';

import { CloseButton, Spacer, Tag, Toolbar } from '@tmlmobilidade/ui';
import { useTranslation } from 'react-i18next';

import { closeExtractionsListModal } from '../ExtractionsList.modal';

/* * */

export function ExtractionsListHeader() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	//
	// B. Render components

	return (
		<Toolbar>
			<CloseButton onClick={closeExtractionsListModal} type="close" />
			<Tag label={t('default:organizations.create.Header.title')} variant="secondary" />
			<Spacer />
		</Toolbar>
	);
}
