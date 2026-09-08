'use client';

/* * */

import { MapContextProvider, Modal } from '@tmlmobilidade/ui';

import { ShapeEditor } from './ShapeEditor';
import { StopsEditorContextProvider } from './ShapeEditor.context';

/* * */

interface ShapeEditorModalProps {
	onClose: () => void
	opened: boolean
}

export function ShapeEditorModal({ onClose, opened }: ShapeEditorModalProps) {
	return (
		<Modal
			closeOnClickOutside={false}
			closeOnEscape={false}
			onClose={onClose}
			opened={opened}
			padding={0}
			size="100%"
			withCloseButton={false}
			styles={{
				body: { height: '100%' },
				content: { height: '90vh' },
			}}
		>
			<MapContextProvider>
				<StopsEditorContextProvider onClose={onClose}>
					<ShapeEditor />
				</StopsEditorContextProvider>
			</MapContextProvider>
		</Modal>
	);
}
