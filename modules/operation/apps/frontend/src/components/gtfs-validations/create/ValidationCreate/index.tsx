'use client';

import { ValidationCreateBasicInfo } from '@/components/gtfs-validations/create/ValidationCreateBasicInfo';
import { ValidationCreateHeader } from '@/components/gtfs-validations/create/ValidationCreateHeader';
import { Pane } from '@tmlmobilidade/ui';

/* * */

export function ValidationCreate() {
	return (
		<Pane header={[<ValidationCreateHeader key="header" />]}>
			<ValidationCreateBasicInfo />
		</Pane>
	);
}
