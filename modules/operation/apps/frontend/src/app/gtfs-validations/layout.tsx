/* * */

import { PanesManager } from '@tmlmobilidade/ui';
import { Fragment, type PropsWithChildren } from 'react';

import { GtfsValidationsList } from '../../components/gtfs-validations/list/GtfsValidationsList';

/* * */

export default function Layout({ children }: PropsWithChildren) {
	return (
		<PanesManager
			id="gtfs-validations"
			panes={[
				<GtfsValidationsList key="gtfs-validations-list" />,
				<Fragment key="gtfs-validations-detail">{children}</Fragment>,
			]}
		/>
	);
}
