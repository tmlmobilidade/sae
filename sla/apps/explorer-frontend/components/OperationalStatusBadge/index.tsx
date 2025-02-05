/* * */

import { Ride } from '@tmlmobilidade/core/types';
import { Badge } from '@tmlmobilidade/ui';

import styles from './styles.module.css';

/* * */

interface Props {
	value?: Ride['operational_status']
}

/* * */

export function OperationalStatusBadge({ value }: Props) {
	//

	if (value === 'scheduled') {
		return <Badge variant="muted">PLANNED</Badge>;
	}

	if (value === 'missed') {
		return <Badge variant="danger">MISSED</Badge>;
	}

	if (value === 'running') {
		return <Badge variant="primary">RUNNING</Badge>;
	}

	if (value === 'ended') {
		return <Badge variant="secondary">ENDED</Badge>;
	}

	//
}
