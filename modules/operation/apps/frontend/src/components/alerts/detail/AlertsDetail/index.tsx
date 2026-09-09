'use client';

import { Pane } from '@tmlmobilidade/ui';

import { AlertsDetailFootnote } from '../AlertsDetailFootnote';
import { AlertsDetailHeader } from '../AlertsDetailHeader';
import { AlertsDetailSectionCauseEffect } from '../AlertsDetailSectionCauseEffect';
import { AlertsDetailSectionDates } from '../AlertsDetailSectionDates';
import { AlertsDetailSectionReferences } from '../AlertsDetailSectionReferences';
import { AlertsDetailSectionTexts } from '../AlertsDetailSectionTexts';
import { useAlertsDetailData } from '../use-alerts-detail-data';

/* * */

export function AlertsDetail() {
	//

	const { isLoading } = useAlertsDetailData();

	return (
		<Pane header={[<AlertsDetailHeader key="header" />]} isLoading={isLoading}>
			<AlertsDetailSectionTexts />
			<AlertsDetailSectionDates />
			<AlertsDetailSectionCauseEffect />
			<AlertsDetailSectionReferences />
			<AlertsDetailFootnote />
		</Pane>
	);
}
