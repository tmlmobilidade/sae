'use client';

import { AlertsDetailView } from '@/components/alerts/detail/AlertsDetailView';
import { useAlertsData } from '@/components/alerts/use-alerts-data';
import { BottomSheet } from '@/components/common/bottom-sheet/BottomSheet';
import { useBottomSheet } from '@/hooks/bottom-sheet/useBottomSheet';
import { useTranslation } from 'react-i18next';

/* * */

export function AlertsDetail() {
	//

	//
	// A. Setup variables

	const { activeBottomSheet, pop } = useBottomSheet();
	const { data: alerts } = useAlertsData();
	const { t } = useTranslation();
	const isOpen = activeBottomSheet?.view === 'alerts-detail';
	const activeAlertId = isOpen ? activeBottomSheet?.entityId : null;

	const alert = activeAlertId ? alerts.find(candidate => candidate._id === activeAlertId) : null;

	//
	// B. Render components

	return (
		<BottomSheet
			onClose={pop}
			opened={isOpen}
			title={t('default:alerts.AlertsDetail.title')}
		>
			{activeAlertId && alert && (
				<AlertsDetailView alert={alert} />
			)}
		</BottomSheet>
	);

	//
}
