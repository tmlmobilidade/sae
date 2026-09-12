'use client';

import { closeModal, openModal } from '@tmlmobilidade/ui';

import { StopsExtract } from './StopsExtract';

/* * */

const MODAL_ID = 'stops-create-modal';

/* * */

export const openStopsExtractModal = () => {
	openModal({
		children: (
			<StopsExtract />
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

export const closeStopsExtractModal = () => {
	closeModal(MODAL_ID);
};
