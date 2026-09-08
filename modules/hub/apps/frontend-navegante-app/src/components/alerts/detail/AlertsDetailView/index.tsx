'use client';

import { AlertDetailContent } from '@/components/alerts/detail/AlertDetailContent';
import { AlertDetailViewHeader } from '@/components/alerts/detail/AlertDetailViewHeader';
import { useAlertsData } from '@/components/alerts/use-alerts-data';
import { Space } from '@mantine/core';
import { type HubAlert } from '@tmlmobilidade/go-types-hub';
import { LoadingSection, Section } from '@tmlmobilidade/ui';

/* * */

interface AlertsDetailViewProps {
	alert: HubAlert
}

export function AlertsDetailView({ alert }: AlertsDetailViewProps) {
	//

	//
	// A. Setup variables

	const { isLoading } = useAlertsData();

	//
	// B. Render componentss

	if (isLoading) {
		return (
			<>
				<Space h="90px" />
				<LoadingSection />
			</>
		);
	}

	return (
		<Section padding="none">
			<AlertDetailViewHeader effect={alert?.effect} title={alert?.title} />
			<AlertDetailContent alert={alert} />
		</Section>
	);
}
