import { Alert } from '@tmlmobilidade/core-types';

export function getAvailableLines(alert: Alert) {
	if (alert.reference_type === 'route') {
		return alert.references.map(reference => reference.parent_id);
	}

	if (alert.reference_type === 'stop') {
		return alert.references.flatMap(reference => reference.child_ids);
	}

	return [];
}

export function getAvailableStops(alert: Alert) {
	if (alert.reference_type === 'route') {
		return alert.references.flatMap(reference => reference.child_ids);
	}

	if (alert.reference_type === 'stop') {
		return alert.references.map(reference => reference.parent_id);
	}

	return [];
}
