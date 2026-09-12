'use client';

import { closeModal, openModal } from '@tmlmobilidade/ui';

import { ExtractionsList } from './ExtractionsList';

/* * */

const MODAL_ID = 'extractions-list-modal';

/* * */

export const openExtractionsListModal = () => {
	openModal({
		children: (
			<ExtractionsList />
		),
		closeOnClickOutside: false,
		closeOnEscape: false,
		modalId: MODAL_ID,
		padding: 0,
		size: 'xl',
		withCloseButton: false,
	});
};

/* * */

export const closeExtractionsListModal = () => {
	closeModal(MODAL_ID);
};
