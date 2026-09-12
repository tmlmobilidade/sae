'use client';

import styles from './styles.module.css';

import { Spacer } from '../../layout/Spacer';
import { EnvironmentTag } from '../../tags/EnvironmentTag';
import { useSidebarContext } from '../Sidebar.context';
import { SidebarExtractions } from '../SidebarExtractions';
import { SidebarNotifications } from '../SidebarNotifications';
import { SidebarOptions } from '../SidebarOptions';

/* * */

export function SidebarFooter() {
	//

	//
	// A. Setup variables

	const sidebarContext = useSidebarContext();

	//
	// B. Render components

	return (
		<div className={styles.footer}>
			<SidebarExtractions />
			{sidebarContext.presentation.visual_mode !== 'collapsed' && <SidebarNotifications />}
			{sidebarContext.presentation.visual_mode !== 'collapsed' && <SidebarOptions />}
			{sidebarContext.presentation.visual_mode !== 'collapsed' && <Spacer />}
			{sidebarContext.presentation.visual_mode !== 'collapsed' && <EnvironmentTag />}
		</div>
	);
}
