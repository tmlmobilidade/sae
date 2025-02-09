/* * */

import { ExtendedRideDisplay } from '@/contexts/Rides.context';
import { Tag } from '@tmlmobilidade/ui';

/* * */

interface Props {
	status?: ExtendedRideDisplay['delay_status']
	timeString?: ExtendedRideDisplay['start_time_observed_display']
}

/* * */

export function StartTimeStatusTag({ status, timeString }: Props) {
	//

	if (status === 'ontime') {
		return (
			<>
				<Tag label={timeString} variant="secondary" />
				<Tag label="Ontime" variant="success" />
			</>
		);
	}

	if (status === 'delayed') {
		return (
			<>
				<Tag label={timeString} variant="warning" />
				<Tag label="Delayed" variant="warning" />
			</>
		);
	}

	if (status === 'early') {
		return (
			<>
				<Tag label={timeString} variant="danger" />
				<Tag label="Early" variant="danger" />
			</>
		);
	}

	//
}
