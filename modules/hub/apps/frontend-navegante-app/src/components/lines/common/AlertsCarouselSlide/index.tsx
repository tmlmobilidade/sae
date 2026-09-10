'use client';

import { AlertActivePeriodStart } from '@/components/alerts/common/AlertActivePeriod';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';
import { IconCircleArrowRightFilled } from '@tabler/icons-react';
import { type HubAlert } from '@tmlmobilidade/go-types-hub';

import styles from './styles.module.css';

/* * */

interface AlertsCarouselSlideProps {
	alert: HubAlert
}

export function AlertsCarouselSlide({ alert }: AlertsCarouselSlideProps) {
	//

	//
	// A. Setup variables

	const { push } = useBottomSheet();

	//
	// B. Handle actions

	const handleClick = () => {
		push({ entityId: alert._id, view: 'alerts-detail' });
	};

	//
	// C. Render components

	return (
		<div className={styles.container}>
			<AlertActivePeriodStart date={alert.active_period_start_date} size="sm" />
			<p className={styles.title} onClick={handleClick}>
				{alert.title}
				<IconCircleArrowRightFilled className={styles.icon} size={16} />
			</p>
		</div>
	);
}
