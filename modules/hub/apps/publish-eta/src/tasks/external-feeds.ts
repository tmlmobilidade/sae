/* * */

import { externalClients } from '@tmlmobilidade/external';
import { type GtfsRtFeedMessage } from '@tmlmobilidade/go-types-gtfs-rt';

/* * */

export interface ExternalFeedConfig {
	agencyId: string
	fetchTripUpdates: () => Promise<GtfsRtFeedMessage>
	label: string
}

export const EXTERNAL_FEEDS: ExternalFeedConfig[] = [
	{
		agencyId: 'N18KL',
		fetchTripUpdates: () => externalClients.cp.tripUpdates(),
		label: 'CP',
	},
];
