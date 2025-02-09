/* * */

import { ExtendedRideDisplay } from '@/contexts/Rides.context';
import { IconCheck, IconX } from '@tabler/icons-react';
import { Tag } from '@tmlmobilidade/ui';

/* * */

interface Props {
	grade?: ExtendedRideDisplay['analysis'][0]['grade']
	operationalStatus?: ExtendedRideDisplay['operational_status']
}

/* * */

export function AnalysisStatusTag({ grade, operationalStatus }: Props) {
	//

	if (operationalStatus === 'scheduled' || operationalStatus === 'running') {
		return;
	}

	if (grade === 'pass') {
		return <Tag icon={<IconCheck />} label="Pass" variant="success" />;
	}

	if (grade === 'fail') {
		return <Tag icon={<IconX stroke={4} />} label="Fail" variant="danger" />;
	}

	//
}
