'use client';

/* * */

import { BottomSheetClose } from '@/components/common/bottom-sheet/BottomSheetClose';
import { type PropsWithChildren, useId } from 'react';
import { Sheet } from 'react-modal-sheet';

import styles from './styles.module.css';

/* * */

interface BottomSheetProps {
	allowBackgroundInteraction?: boolean
	onClose: () => void
	opened: boolean
	size?: 'fit' | 'full' | 'half' | 'short'
	title?: string
}

/* * */

const SHEET_SNAP_POINTS_BY_SIZE: Record<NonNullable<BottomSheetProps['size']>, number[]> = {
	fit: [0, 1],
	full: [0, 0.95],
	half: [0, 0.55],
	short: [0, 0.32],
};

/* * */

export function BottomSheet({
	allowBackgroundInteraction,
	children,
	onClose,
	opened,
	size = 'fit',
	title,
}: PropsWithChildren<BottomSheetProps>) {
	//

	//
	// A. Setup variables

	const titleId = useId();
	const snapPoints = SHEET_SNAP_POINTS_BY_SIZE[size];
	const detent = size === 'fit' ? 'content' : 'full';

	//
	// B. Render components

	return (
		<Sheet
			className={styles.root}
			detent={detent}
			initialSnap={1}
			isOpen={opened}
			onClose={onClose}
			snapPoints={snapPoints}
		>
			<Sheet.Container
				aria-labelledby={title ? titleId : undefined}
				aria-modal={true}
				className={styles.container}
				role="dialog"
			>
				<Sheet.Header className={styles.header}>
					<div className={styles.headerLeft} />

					<h1 className={styles.title} id={titleId}>
						{title ?? ''}
					</h1>

					<div className={styles.headerRight}>
						<BottomSheetClose onClick={onClose} />
					</div>
				</Sheet.Header>

				<Sheet.Content className={styles.content}>
					{children}
				</Sheet.Content>
			</Sheet.Container>

			{!allowBackgroundInteraction && <Sheet.Backdrop className={styles.backdrop} onTap={onClose} />}
		</Sheet>
	);

	//
}
