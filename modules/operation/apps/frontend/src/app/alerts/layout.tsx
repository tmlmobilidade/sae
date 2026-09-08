/* * */

import { PanesManager } from '@tmlmobilidade/ui';
import { Fragment, type PropsWithChildren } from 'react';

import { AlertsList } from '../../components/alerts/list/AlertsList';

/* * */

export default function Layout({ children }: PropsWithChildren) {
	return (
		<PanesManager
			id="alerts"
			panes={[
				<AlertsList key="alerts-list" />,
				<Fragment key="alerts-detail">{children}</Fragment>,
			]}
		/>
	);
}
