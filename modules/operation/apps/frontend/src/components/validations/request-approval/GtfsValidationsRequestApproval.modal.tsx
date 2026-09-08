'use client';

import { closeModal, openModal } from '@tmlmobilidade/ui';

import { GtfsValidationsRequestApproval } from './GtfsValidationsRequestApproval';

/* * */

const MODAL_ID = 'organizations-create-modal';

/* * */

export const openGtfsValidationsRequestApprovalModal = () => {
	openModal({
		children: (
			<GtfsValidationsRequestApproval />
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

export const closeGtfsValidationsRequestApprovalModal = () => {
	closeModal(MODAL_ID);
};
