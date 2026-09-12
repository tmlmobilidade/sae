'use client';

import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpandFilled } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

import { IconButton } from '../../../buttons';
import { useSidebarContext } from '../Sidebar.context';
import { SidebarHeaderGreeting } from '../SidebarHeaderGreeting';
import { SidebarHeaderLogo } from '../SidebarHeaderLogo';

/* * */

export function SidebarHeader() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const sidebarContext = useSidebarContext();

	//
	// B. Transform data

	const toggleAriaLabel = sidebarContext.presentation.visual_mode !== 'collapsed'
		? t('shared:components.sidebar.Sidebar.pin_sidebar_aria')
		: t('shared:components.sidebar.Sidebar.unpin_sidebar_aria');

	const toggleIcon = sidebarContext.presentation.visual_mode === 'pinned'
		? <IconLayoutSidebarLeftCollapse size={20} />
		: <IconLayoutSidebarLeftExpandFilled size={20} />;

	//
	// C. Render components

	return (
		<div className={styles.container}>
			<SidebarHeaderLogo />
			{sidebarContext.presentation.visual_mode !== 'collapsed' && (
				<div className={styles.inner}>
					<SidebarHeaderGreeting />
					<IconButton
						aria-label={toggleAriaLabel}
						icon={toggleIcon}
						onClick={sidebarContext.presentation.toggleIsPinned}
						tooltip={toggleAriaLabel}
					/>
				</div>
			)}
		</div>
	);
}
