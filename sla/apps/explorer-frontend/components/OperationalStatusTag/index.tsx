/* * */

import { IconFlag3Filled, IconPlayerPlayFilled, IconPlayerTrackNextFilled, IconX } from '@tabler/icons-react';
import { type RideDisplay } from '@tmlmobilidade/core/types';
import { Tag } from '@tmlmobilidade/ui';

/* * */

interface Props {
	value?: RideDisplay['operational_status']
}

/* * */

export function OperationalStatusTag({ value }: Props) {
	//

	if (value === 'scheduled') {
		return <Tag icon={<IconPlayerTrackNextFilled />} label="Scheduled" variant="muted" />;
	}

	if (value === 'missed') {
		return <Tag icon={<IconX stroke={4} />} label="Missed" variant="danger" filled />;
	}

	if (value === 'running') {
		return <Tag icon={<IconPlayerPlayFilled />} label="Running" variant="primary" filled />;
	}

	if (value === 'ended') {
		return <Tag icon={<IconFlag3Filled />} label="Ended" variant="secondary" />;
	}

	//
}
