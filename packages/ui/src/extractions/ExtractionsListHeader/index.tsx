'use client';

import { CloseButton, Label, LoadingActivity, Spacer, Toolbar } from '@tmlmobilidade/ui';
import { useTranslation } from 'react-i18next';

import { closeExtractionsListModal } from '../ExtractionsList.modal';
import { ExtractionsListFilterSearch } from '../filters/ExtractionsListFilterSearch';
import { useExtractionsListData } from '../use-extractions-list-data';

/* * */

export function ExtractionsListHeader() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const { isLoading, isValidating, timestamp } = useExtractionsListData();

	//
	// B. Render components

	return (
		<Toolbar>
			<CloseButton onClick={closeExtractionsListModal} type="close" />
			<Label size="lg" caps singleLine>{t('shared:extractions.ExtractionsListHeader.title')}</Label>
			<LoadingActivity isLoading={isLoading} isValidating={isValidating} timestamp={timestamp} />
			<Spacer />
			<ExtractionsListFilterSearch />
		</Toolbar>
	);
}
