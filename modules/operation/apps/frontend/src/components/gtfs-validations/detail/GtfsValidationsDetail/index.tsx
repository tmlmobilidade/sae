'use client';

import { Pane } from '@tmlmobilidade/ui';

import { ValidationsDetailFootnote } from '../ValidationsDetailFootnote';
import { ValidationsDetailHeader } from '../ValidationsDetailHeader';
import { ValidationsDetailSectionAgency } from '../ValidationsDetailSectionAgency';
import { ValidationsDetailSectionFeedInfo } from '../ValidationsDetailSectionFeedInfo';
import { ValidationsDetailSectionResult } from '../ValidationsDetailSectionResult';

/* * */

export function GtfsValidationsDetail() {
	return (
		<Pane header={[<ValidationsDetailHeader key="header" />]}>
			<ValidationsDetailSectionAgency />
			<ValidationsDetailSectionFeedInfo />
			<ValidationsDetailSectionResult />
			<ValidationsDetailFootnote />
		</Pane>
	);
}
