'use client';

import { closeModal, openModal } from '@tmlmobilidade/ui';

import { GtfsValidationsApprove } from './GtfsValidationsApprove';

/* * */

const MODAL_ID = 'organizations-create-modal';

/* * */

export const openGtfsValidationsApproveModal = () => {
	openModal({
		children: (
			<GtfsValidationsApprove />
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

export const closeGtfsValidationsApproveModal = () => {
	closeModal(MODAL_ID);
};
