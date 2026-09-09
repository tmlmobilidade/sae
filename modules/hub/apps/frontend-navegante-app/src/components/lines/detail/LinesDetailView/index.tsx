'use client';

import { FeedbackForm } from '@/components/feedback';
import { useLinesDetailContext } from '@/components/lines/detail/LinesDetail.context';
import { LinesDetailAlerts } from '@/components/lines/detail/LinesDetailAlerts';
import { LinesDetailPath } from '@/components/lines/detail/LinesDetailPath';
import { LinesDetailToolbar } from '@/components/lines/detail/LinesDetailToolbar';
import { LinesDetailViewHeader } from '@/components/lines/detail/LinesDetailViewHeader';
import { Divider, LoadingSection, Section, Space } from '@tmlmobilidade/ui';

/* * */

export function LinesDetailView() {
	//

	//
	// A. Setup variables

	const linesDetailContext = useLinesDetailContext();

	//
	// B. Render componentss

	if (linesDetailContext.flags.is_loading) {
		return (
			<>
				<Space h="90px" />
				<LoadingSection />
			</>
		);
	}

	return (
		<Section padding="none">
			<LinesDetailViewHeader />
			<FeedbackForm agencyId={linesDetailContext.data.line?.agency_id} entityId={linesDetailContext.data.line?._id} entityType="line" />
			<Divider />
			<LinesDetailToolbar />
			<LinesDetailAlerts />
			<LinesDetailPath />
		</Section>
	);
}
