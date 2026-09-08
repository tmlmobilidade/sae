/* * */

import { type GtfsAgency } from '@tmlmobilidade/go-types-gtfs';
import { Grid, ValueDisplay } from '@tmlmobilidade/ui';

/* * */

interface AgencyDisplayProps {
	data?: GtfsAgency
}

/* * */

export function AgencyDisplay({ data }: AgencyDisplayProps) {
	//

	if (!data) {
		return null;
	}

	return (
		<Grid columns="abc" gap="lg">
			<ValueDisplay label="agency_id" value={data.agency_id || 'N/A'} />
			<ValueDisplay label="agency_name" value={data.agency_name || 'N/A'} />
			<ValueDisplay label="agency_url" value={data.agency_url || 'N/A'} />
			<ValueDisplay label="agency_email" value={data.agency_email || 'N/A'} />
			<ValueDisplay label="agency_timezone" value={data.agency_timezone || 'N/A'} />
			<ValueDisplay label="agency_fare_url" value={data.agency_fare_url || 'N/A'} />
			<ValueDisplay label="agency_lang" value={data.agency_lang || 'N/A'} />
			<ValueDisplay label="agency_phone" value={data.agency_phone || 'N/A'} />
		</Grid>
	);
}
