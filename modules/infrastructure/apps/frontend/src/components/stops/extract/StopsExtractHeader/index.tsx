'use client';

import { CloseButton, Label, Toolbar } from '@tmlmobilidade/ui';

import { closeStopsExtractModal } from '../StopsExtract.modal';

/* * */

export function StopsExtractHeader() {
	return (
		<Toolbar>
			<CloseButton onClick={closeStopsExtractModal} type="close" />
			<Label size="lg" singleLine>Exportar paragens</Label>
		</Toolbar>
	);
}
